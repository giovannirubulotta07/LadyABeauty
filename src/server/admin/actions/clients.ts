"use server";

import { z } from "zod";
import {
  blankToUndefined,
  emailSchema,
  fullNameSchema,
  phoneSchema,
} from "@/lib/validation";
import { type ActionResult, fail } from "@/server/actions/result";
import { createAdminClient } from "@/server/db/admin-client";
import { adminAction } from "../action-utils";
import { type ClientSummary, searchClients } from "../clients";

export async function findClients(
  input: unknown,
): Promise<ActionResult<{ clients: ClientSummary[] }>> {
  return adminAction(
    z.object({ query: z.string().max(120) }),
    input,
    async ({ query }) => ({
      ok: true,
      data: { clients: await searchClients(query, 8) },
    }),
    { refreshView: false },
  );
}

const clientSchema = z.object({
  fullName: fullNameSchema,
  email: z.preprocess(blankToUndefined, emailSchema.optional()),
  phone: z.preprocess(blankToUndefined, phoneSchema.optional()),
});

const duplicateEmail = (error: { code?: string } | null) =>
  error?.code === "23505"
    ? fail("Cette adresse e-mail est déjà utilisée par une autre cliente.", {
        email: "Déjà utilisée par une autre cliente.",
      })
    : null;

export async function createStudioClient(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  return adminAction(clientSchema, input, async (data) => {
    const { data: row, error } = await createAdminClient()
      .from("clients")
      .insert({
        full_name: data.fullName,
        email: data.email ?? null,
        phone: data.phone ?? null,
      })
      .select("id")
      .single();
    const duplicate = duplicateEmail(error);
    if (duplicate) return duplicate;
    if (error) throw error;
    return { ok: true, data: { id: row.id } };
  });
}

export async function updateClient(input: unknown): Promise<ActionResult> {
  return adminAction(
    clientSchema.extend({ id: z.uuid() }),
    input,
    async (data) => {
      const db = createAdminClient();
      const { data: current } = await db
        .from("clients")
        .select("user_id, email")
        .eq("id", data.id)
        .maybeSingle();
      if (!current) return fail("Cliente introuvable.");
      // Her e-mail is her login: only she can change it (from Mon espace).
      if (current.user_id && (data.email ?? null) !== current.email)
        return fail(
          "Cette cliente a un compte : l'e-mail ne peut pas être modifié ici.",
          {
            email: "Lié à son compte : elle seule peut le modifier.",
          },
        );
      const { error } = await db
        .from("clients")
        .update({
          full_name: data.fullName,
          email: data.email ?? null,
          phone: data.phone ?? null,
        })
        .eq("id", data.id);
      const duplicate = duplicateEmail(error);
      if (duplicate) return duplicate;
      if (error) throw error;
      return { ok: true };
    },
  );
}

export async function addClientNote(input: unknown): Promise<ActionResult> {
  return adminAction(
    z.object({
      clientId: z.uuid(),
      body: z
        .string()
        .trim()
        .min(1, "La note est vide.")
        .max(4000, "4000 caractères maximum."),
    }),
    input,
    async ({ clientId, body }, admin) => {
      const { error } = await createAdminClient()
        .from("client_notes")
        .insert({ client_id: clientId, body, created_by: admin.id });
      if (error) throw error;
      return { ok: true };
    },
  );
}

export async function deleteClientNote(input: unknown): Promise<ActionResult> {
  return adminAction(z.object({ id: z.uuid() }), input, async ({ id }) => {
    const { error } = await createAdminClient()
      .from("client_notes")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  });
}
