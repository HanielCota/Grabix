// Client helper: kick off the Pro subscription. Asks the server to create a
// Mercado Pago checkout (tied to the current user) and redirects there.
export async function startCheckout(): Promise<void> {
  const res = await fetch("/api/billing/subscribe", { method: "POST" });
  const data = await res.json().catch(() => ({}));

  if (res.ok && data.init_point) {
    window.location.href = data.init_point;
    return;
  }

  throw new Error(data.error?.message ?? "Não foi possível iniciar a assinatura. Tente novamente.");
}
