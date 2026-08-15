import { describe, expect, it } from "vitest";
import { crc16ccittHex } from "../crc";
import { parseTLV, serializeTLV, upsertField } from "../tlv";
import { decodePayload, createPaymentPayload } from "../pipeline";
import { DEMO_QRS, DEMO_UNSUPPORTED_QR } from "../demo";
import { formatAmount, validateAmount } from "../currency";

const demo = DEMO_QRS[0]!.payload;

describe("CRC-16/CCITT-FALSE", () => {
  it("matches the EMVCo reference vector", () => {
    expect(crc16ccittHex("123456789")).toBe("29B1");
  });
});

describe("TLV", () => {
  it("parses and re-serializes without loss", () => {
    const fields = parseTLV(demo)!;
    expect(fields).not.toBeNull();
    expect(serializeTLV(fields)).toBe(demo);
  });

  it("rejects a broken structure", () => {
    expect(parseTLV("0002015902AB99")).toBeNull();
    expect(parseTLV("00XX01")).toBeNull();
  });

  it("keeps IDs ordered when inserting", () => {
    const fields = upsertField([{ id: "00", value: "01" }, { id: "59", value: "X" }], "54", "5000");
    expect(fields.map((f) => f.id)).toEqual(["00", "54", "59"]);
  });
});

describe("decodePayload", () => {
  it("parses a valid EMVCo QR", () => {
    const result = decodePayload(demo);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.format).toBe("emvco-mpm");
      expect(result.data.currency).toBe("LAK");
      expect(result.data.supportsAmountInjection).toBe(true);
      expect(result.data.merchantName).toContain("DEMO");
    }
  });

  it("rejects an unknown (non payment) QR", () => {
    const result = decodePayload(DEMO_UNSUPPORTED_QR);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unknown-format");
  });

  it("rejects a tampered checksum", () => {
    const tampered = demo.slice(0, -4) + "0000";
    const result = decodePayload(tampered);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty payload", () => {
    expect(decodePayload("").ok).toBe(false);
  });
});

describe("amount validation", () => {
  it("accepts positive integers only", () => {
    expect(validateAmount(50000).ok).toBe(true);
    expect(validateAmount(0).ok).toBe(false);
    expect(validateAmount(-1000).ok).toBe(false);
    expect(validateAmount(1500.5).ok).toBe(false);
    expect(validateAmount(Number.NaN).ok).toBe(false);
    expect(validateAmount(10_000_000_000).ok).toBe(false);
  });

  it("formats thousands", () => {
    expect(formatAmount(100000).replace(/\u202f/g, " ")).toBe("100 000");
  });
});

describe("createPaymentPayload", () => {
  it("critical: generated QR decodes back to the exact amount", () => {
    const payment = createPaymentPayload(demo, 50000);
    expect(payment.validationStatus).toBe("valid");
    const decoded = decodePayload(payment.generatedPayload);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.data.amount).toBe(50000);
      expect(decoded.data.merchantName).toBe(
        decodePayload(demo).ok ? (decodePayload(demo) as { data: { merchantName: string } }).data.merchantName : null,
      );
    }
  });

  it("recomputes a valid CRC", () => {
    const payment = createPaymentPayload(demo, 12345);
    const payload = payment.generatedPayload;
    const base = payload.slice(0, -4);
    expect(payload.slice(-4)).toBe(crc16ccittHex(base));
  });

  it("marks the QR as dynamic (tag 01 = 12)", () => {
    const payment = createPaymentPayload(demo, 1000);
    expect(payment.generatedPayload).toContain("010212");
  });

  it("handles very large but allowed amounts", () => {
    const payment = createPaymentPayload(demo, 1_500_000);
    expect(payment.validationStatus).toBe("valid");
    const decoded = decodePayload(payment.generatedPayload);
    expect(decoded.ok && decoded.data.amount).toBe(1_500_000);
  });

  it("refuses zero, negative and non-payment QR", () => {
    expect(createPaymentPayload(demo, 0).validationStatus).toBe("invalid");
    expect(createPaymentPayload(demo, -500).validationStatus).toBe("invalid");
    expect(createPaymentPayload(DEMO_UNSUPPORTED_QR, 1000).validationStatus).toBe("invalid");
  });

  it("never returns a payload when invalid", () => {
    expect(createPaymentPayload(demo, 0).generatedPayload).toBe("");
  });

  it("replaces an existing amount instead of duplicating it", () => {
    const first = createPaymentPayload(demo, 1000).generatedPayload;
    const second = createPaymentPayload(first, 7000);
    expect(second.validationStatus).toBe("valid");
    const decoded = decodePayload(second.generatedPayload);
    expect(decoded.ok && decoded.data.amount).toBe(7000);
  });
});
