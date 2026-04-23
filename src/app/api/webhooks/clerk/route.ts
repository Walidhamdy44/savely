import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

type ClerkUserEventData = {
  id: string;
  email_addresses: { email_address: string }[];
  username: string | null;
  image_url: string;
};

type ClerkWebhookEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: ClerkUserEventData;
};

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: ClerkWebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { id, email_addresses, username, image_url } = evt.data;
  const email = email_addresses[0]?.email_address;

  if (!email) {
    return new Response("No email on user event", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    await prisma.user.upsert({
      where: { clerkId: id },
      create: {
        clerkId: id,
        email,
        username: username ?? null,
        imageUrl: image_url,
      },
      update: {
        email,
        username: username ?? null,
        imageUrl: image_url,
      },
    });
  }

  if (evt.type === "user.deleted") {
    await prisma.user.deleteMany({ where: { clerkId: id } });
  }

  return new Response("OK", { status: 200 });
}
