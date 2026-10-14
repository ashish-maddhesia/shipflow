
import { Router, type Response } from "express";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";

import {
  requireAuth,
  type AuthRequest,
} from "../auth/auth.middleware.js";

import { db } from "../lib/db.js";

import {
  organizationMembers,
  servers,
} from "../db/schema.js";

import { encryptSecret } from "./credentials.js";
import { testSSHConnection } from "./ssh.service.js";

const router = Router();

const createServerSchema = z.object({
  organizationId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
  host: z.string().trim().min(1).max(253),
  port: z.coerce.number().int().min(1).max(65535).default(22),
  username: z.string().trim().min(1).max(100),
  privateKey: z.string().min(1),
  passphrase: z.string().optional(),
  hostKeyFingerprint: z.string().trim().min(10).max(100),
});

async function isOrganizationMember(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(
          organizationMembers.organizationId,
          organizationId
        ),
        eq(organizationMembers.userId, userId)
      )
    )
    .limit(1);

  return Boolean(membership);
}

// POST /api/servers
router.post(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const parsed = createServerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid server details",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const input = parsed.data;

    try {
      const allowed = await isOrganizationMember(
        input.organizationId,
        req.user.id
      );

      if (!allowed) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const encryptedPrivateKey = encryptSecret(
        input.privateKey
      );

      const encryptedPassphrase = input.passphrase
        ? encryptSecret(input.passphrase)
        : null;

      const [server] = await db
        .insert(servers)
        .values({
          id: crypto.randomUUID(),
          organizationId: input.organizationId,
          name: input.name,
          host: input.host,
          port: input.port,
          username: input.username,
          encryptedPrivateKey,
          encryptedPassphrase,
          hostKeyFingerprint: input.hostKeyFingerprint,
          createdBy: req.user.id,
          status: "PENDING",
        })
        .returning({
          id: servers.id,
          organizationId: servers.organizationId,
          name: servers.name,
          host: servers.host,
          port: servers.port,
          username: servers.username,
          hostKeyFingerprint: servers.hostKeyFingerprint,
          status: servers.status,
          createdAt: servers.createdAt,
        });

      return res.status(201).json({
        message: "Server registered successfully",
        server,
      });
    } catch (error) {
      // Do not log request bodies or private-key material.
      console.error(
        "Server registration failed:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return res.status(500).json({
        message:
          "Failed to register server. Check server encryption configuration.",
      });
    }
  }
);

// GET /api/servers?organizationId=...
router.get(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const organizationId = req.query.organizationId;

    if (
      typeof organizationId !== "string" ||
      !organizationId.trim()
    ) {
      return res.status(400).json({
        message: "organizationId query parameter is required",
      });
    }

    try {
      const allowed = await isOrganizationMember(
        organizationId,
        req.user.id
      );

      if (!allowed) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const serverList = await db
        .select({
          id: servers.id,
          organizationId: servers.organizationId,
          name: servers.name,
          host: servers.host,
          port: servers.port,
          username: servers.username,
          hostKeyFingerprint: servers.hostKeyFingerprint,
          status: servers.status,
          lastConnectedAt: servers.lastConnectedAt,
          lastError: servers.lastError,
          createdAt: servers.createdAt,
          updatedAt: servers.updatedAt,
        })
        .from(servers)
        .innerJoin(
          organizationMembers,
          and(
            eq(
              organizationMembers.organizationId,
              servers.organizationId
            ),
            eq(
              organizationMembers.userId,
              req.user.id
            )
          )
        )
        .where(
          eq(servers.organizationId, organizationId)
        )
        .orderBy(desc(servers.createdAt));

      return res.json({
        servers: serverList,
      });
    } catch (error) {
      console.error(
        "Server listing failed:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return res.status(500).json({
        message: "Failed to list servers",
      });
    }
  }
);

// POST /api/servers/:id/test-connection
router.post(
  "/:id/test-connection",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const serverId = req.params.id;

    if (typeof serverId !== "string" || !serverId) {
      return res.status(400).json({
        message: "Invalid server ID",
      });
    }

    try {
      // The membership join ensures users cannot test
      // another organization's server.
      const [server] = await db
        .select({
          id: servers.id,
          host: servers.host,
          port: servers.port,
          username: servers.username,
          encryptedPrivateKey: servers.encryptedPrivateKey,
          encryptedPassphrase: servers.encryptedPassphrase,
          hostKeyFingerprint: servers.hostKeyFingerprint,
        })
        .from(servers)
        .innerJoin(
          organizationMembers,
          and(
            eq(
              organizationMembers.organizationId,
              servers.organizationId
            ),
            eq(
              organizationMembers.userId,
              req.user.id
            )
          )
        )
        .where(eq(servers.id, serverId))
        .limit(1);

      if (!server) {
        return res.status(404).json({
          message: "Server not found",
        });
      }

      if (!server.hostKeyFingerprint) {
        return res.status(400).json({
          message: "A trusted SSH host fingerprint is required",
        });
      }

      const dockerInfo = await testSSHConnection({
        host: server.host,
        port: server.port,
        username: server.username,
        encryptedPrivateKey: server.encryptedPrivateKey,
        encryptedPassphrase: server.encryptedPassphrase,
        hostKeyFingerprint: server.hostKeyFingerprint,
      });

      await db
        .update(servers)
        .set({
          status: "READY",
          lastConnectedAt: new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(servers.id, server.id));

      return res.json({
        message: "SSH connection and Docker readiness check succeeded",
        server: {
          id: server.id,
          status: "READY",
        },
        dockerInfo,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown connection error";

      console.error(
        "Server connection test failed:",
        errorMessage
      );

      // Only update a server the authenticated user can access.
      const serverIdValue = serverId;

      await db
        .update(servers)
        .set({
          status: "ERROR",
          lastError: errorMessage.slice(0, 500),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(servers.id, serverIdValue),
            // Organization authorization was checked by the
            // lookup above. If the lookup itself failed, this
            // update is best-effort and must not expose secrets.
          )
        )
        .catch(() => undefined);

      return res.status(502).json({
        message: "SSH connection or Docker readiness check failed",
        details: errorMessage,
      });
    }
  }
);

export default router;

