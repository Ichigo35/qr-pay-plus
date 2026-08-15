import { findAdapter, getAdapterById } from "./adapters";
import { validateAmount } from "./currency";
import type { ParseResult, PaymentQR } from "./types";

/** Décodage + détection de format + parsing. Ne fait jamais confiance au contenu du QR. */
export function decodePayload(raw: string): ParseResult {
  const payload = (raw ?? "").trim();
  if (!payload) {
    return { ok: false, reason: "invalid-structure", message: "QR vide." };
  }
  if (payload.length > 4096) {
    return { ok: false, reason: "unknown-format", message: "Contenu du QR trop long." };
  }
  const adapter = findAdapter(payload);
  if (!adapter) {
    return {
      ok: false,
      reason: "unknown-format",
      message: "Format de paiement non reconnu.",
    };
  }
  return adapter.parse(payload);
}

/**
 * Injection du montant + reconstruction + re-décodage de contrôle.
 * Le QR n'est déclaré valide que si le payload régénéré se re-parse et que le
 * montant décodé correspond exactement au montant demandé.
 */
export function createPaymentPayload(originalPayload: string, amount: number): PaymentQR {
  const invalid = (validationError: string): PaymentQR => ({
    originalPayload,
    amount,
    generatedPayload: "",
    validationStatus: "invalid",
    validationError,
  });

  const amountCheck = validateAmount(amount);
  if (!amountCheck.ok) return invalid("Montant invalide.");

  const parsed = decodePayload(originalPayload);
  if (!parsed.ok) return invalid(parsed.message);
  if (!parsed.data.supportsAmountInjection) {
    return invalid("Ce QR n'est pas compatible avec la génération d'un montant prérempli.");
  }

  const adapter = getAdapterById(parsed.data.adapterId);
  if (!adapter) return invalid("Adaptateur introuvable.");

  const injected = adapter.injectAmount(originalPayload, amount);
  if (!injected.ok) return invalid(injected.message);

  // Vérification finale : re-décodage complet du payload généré.
  const reparsed = decodePayload(injected.payload);
  if (!reparsed.ok) return invalid("Le QR généré n'a pas pu être revalidé.");
  if (!adapter.validate(injected.payload)) return invalid("Checksum du QR généré invalide.");
  if (reparsed.data.amount !== amount) return invalid("Le montant du QR généré ne correspond pas.");
  if (reparsed.data.merchantId !== parsed.data.merchantId) {
    return invalid("Les informations du bénéficiaire ont changé.");
  }

  return {
    originalPayload,
    amount,
    generatedPayload: injected.payload,
    validationStatus: "valid",
  };
}
