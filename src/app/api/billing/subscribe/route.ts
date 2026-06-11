import { type NextRequest, NextResponse } from "next/server";
import { Errors } from "@/features/media-downloader/domain/errors";
import { handleApiError } from "@/server/api-utils";
import { requireUser } from "@/server/auth-guard";
import { createCheckoutPreference } from "@/server/mercadopago";
import { getEffectivePricing } from "@/server/plans-config";

// Starts a one-time Mercado Pago checkout (Pix or card) for the signed-in user and
// returns the checkout link. external_reference = userId, so the payment webhook
// can match the payment back to this account without relying on the email.
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.email) {
      throw Errors.upgradeRequired("Sua conta precisa de um e-mail para pagar.");
    }

    const { amountCents } = await getEffectivePricing();
    const amount = amountCents / 100;
    const origin = request.nextUrl.origin;

    const { initPoint } = await createCheckoutPreference({
      userId: user.id,
      payerEmail: user.email,
      amount,
      backUrl: `${origin}/?assinatura=ok`,
      notificationUrl: `${origin}/api/webhooks/mercadopago`,
    });

    return NextResponse.json({ init_point: initPoint });
  } catch (err) {
    return await handleApiError(err);
  }
}
