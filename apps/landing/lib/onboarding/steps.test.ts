import { describe, it, expect } from "vitest";
import {
  ONBOARDING_STEPS,
  isKnownStep,
  deriveStepFromStatus,
  getStepIndex,
} from "./steps";
import type { OnboardingStatus, OnboardingStepId } from "./types";

describe("ONBOARDING_STEPS", () => {
  it("contains exactly 6 steps", () => {
    expect(ONBOARDING_STEPS).toHaveLength(6);
  });

  it("has the correct step IDs in order", () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(ids).toEqual(["plan", "account", "verify", "signin", "billing", "complete"]);
  });

  it("each step has id, label, and description", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step).toHaveProperty("id");
      expect(step).toHaveProperty("label");
      expect(step).toHaveProperty("description");
      expect(typeof step.id).toBe("string");
      expect(typeof step.label).toBe("string");
      expect(typeof step.description).toBe("string");
    }
  });
});

describe("isKnownStep", () => {
  it("returns true for all valid step IDs", () => {
    const validSteps: OnboardingStepId[] = [
      "plan",
      "account",
      "verify",
      "signin",
      "billing",
      "complete",
    ];
    for (const step of validSteps) {
      expect(isKnownStep(step)).toBe(true);
    }
  });

  it("returns false for unknown step strings", () => {
    expect(isKnownStep("unknown")).toBe(false);
    expect(isKnownStep("")).toBe(false);
    expect(isKnownStep("PLAN")).toBe(false);
    expect(isKnownStep("Plan")).toBe(false);
  });
});

describe("deriveStepFromStatus", () => {
  function makeStatus(nextStep: OnboardingStepId): OnboardingStatus {
    return {
      authenticated: false,
      userId: null,
      email: null,
      isEmailVerified: false,
      workspaceId: null,
      role: null,
      canManageBilling: false,
      subscription: null,
      billingProfile: null,
      billingState: "none",
      nextStep,
    };
  }

  it("returns the nextStep from the status object", () => {
    expect(deriveStepFromStatus(makeStatus("plan"))).toBe("plan");
    expect(deriveStepFromStatus(makeStatus("account"))).toBe("account");
    expect(deriveStepFromStatus(makeStatus("verify"))).toBe("verify");
    expect(deriveStepFromStatus(makeStatus("signin"))).toBe("signin");
    expect(deriveStepFromStatus(makeStatus("billing"))).toBe("billing");
    expect(deriveStepFromStatus(makeStatus("complete"))).toBe("complete");
  });
});

describe("getStepIndex", () => {
  it("returns 0 for plan", () => {
    expect(getStepIndex("plan")).toBe(0);
  });

  it("returns 1 for account", () => {
    expect(getStepIndex("account")).toBe(1);
  });

  it("returns 2 for verify", () => {
    expect(getStepIndex("verify")).toBe(2);
  });

  it("returns 3 for signin", () => {
    expect(getStepIndex("signin")).toBe(3);
  });

  it("returns 4 for billing", () => {
    expect(getStepIndex("billing")).toBe(4);
  });

  it("returns 5 for complete", () => {
    expect(getStepIndex("complete")).toBe(5);
  });

  it("returns 0 for an unknown step (fallback behavior)", () => {
    // The function returns 0 when findIndex returns -1
    expect(getStepIndex("nonexistent" as OnboardingStepId)).toBe(0);
  });
});
