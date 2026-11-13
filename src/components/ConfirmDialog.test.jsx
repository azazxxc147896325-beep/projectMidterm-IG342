import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("exposes dialog labels and closes with Escape", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="ลบโพสต์นี้?" description="ไม่สามารถย้อนกลับได้" onCancel={onCancel} onConfirm={() => {}} />);

    expect(screen.getByRole("alertdialog", { name: "ลบโพสต์นี้?" })).toHaveAccessibleDescription("ไม่สามารถย้อนกลับได้");
    expect(screen.getByRole("button", { name: "ยกเลิก" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not close with Escape while an action is busy", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="ลบโพสต์นี้?" description="ไม่สามารถย้อนกลับได้" busy onCancel={onCancel} onConfirm={() => {}} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });
});
