import { type NextRequest, NextResponse } from "next/server";
import { Errors } from "@/features/media-downloader/domain/errors";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { createPreapproval } from "@/server/mercadopago";
import { getEffectivePricing } from "@/server/plans-config";

// Starts a Mercado Pago subscription for the signed-in user and returns the
// checkout link. external_reference = userId, so the webhook can match the
// payment back to this account without relying on the email.
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.email) {
      throw Errors.upgradeRequired("Sua conta precisa de um e-mail para assinar.");
    }

    const { amountCents } = await getEffectivePricing();
    const amount = amountCents / 100;
    const backUrl = `${request.nextUrl.origin}/?assinatura=ok`;

    const { initPoint } = await createPreapproval({
      userId: user.id,
      payerEmail: user.email,
      amount,
      backUrl,
    });

    return NextResponse.json({ init_point: initPoint });
  } catch (err) {
    return await handleApiError(err);
  }
}
