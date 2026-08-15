/**
 * Types partagés du pipeline QR.
 * QR Decoder -> Format Detection -> Bank Detection -> Parser -> Amount Injection
 * -> CRC -> Generator -> Validation
 */

export type QRFormat = "emvco-mpm" | "unknown";

export interface QRField {
  id: string;
  value: string;
  children?: QRField[];
}

export interface QRData {
  rawPayload: string;
  format: QRFormat;
  /** Identifiant d'adaptateur ayant parsé ce QR */
  adapterId: string;
  /** Banque / réseau détecté à partir du CONTENU du QR (jamais de l'apparence) */
  bank: string | null;
  merchantName: string | null;
  merchantId: string | null;
  merchantCity: string | null;
  currency: string | null;
  currencyCode: string | null;
  amount: number | null;
  /** true si le format permet de manière fiable d'injecter un montant */
  supportsAmountInjection: boolean;
  fields: QRField[];
  additionalData: Record<string, string>;
}

export interface PaymentQR {
  originalPayload: string;
  amount: number;
  generatedPayload: string;
  validationStatus: "valid" | "invalid";
  validationError?: string;
}

export interface ParseSuccess {
  ok: true;
  data: QRData;
}

export interface ParseFailure {
  ok: false;
  /** unknown-format = QR lisible mais pas un QR de paiement reconnu */
  reason: "unknown-format" | "invalid-structure" | "invalid-checksum";
  message: string;
}

export type ParseResult = ParseSuccess | ParseFailure;

export interface InjectSuccess {
  ok: true;
  payload: string;
}
export interface InjectFailure {
  ok: false;
  message: string;
}
export type InjectResult = InjectSuccess | InjectFailure;

/**
 * Contrat que doit respecter chaque adaptateur de format / banque.
 * Aucune logique spécifique ne doit vivre en dehors d'un adaptateur.
 */
export interface BankAdapter {
  id: string;
  label: string;
  format: QRFormat;
  /** Le payload ressemble-t-il à ce format ? */
  detect(raw: string): boolean;
  /** Parse + validation structurelle stricte */
  parse(raw: string): ParseResult;
  /** Validation d'un payload (structure + checksum) */
  validate(raw: string): boolean;
  /** Injecte un montant et reconstruit le payload (CRC recalculé) */
  injectAmount(raw: string, amount: number): InjectResult;
}
