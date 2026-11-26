import { useState } from "react";

// Quản lý popup xác nhận cho một trang.
//
//   const { askConfirm, dialogProps } = useConfirm();
//   askConfirm({ title, message, confirmLabel, action: async () => { ...làm việc... } });
//   <ConfirmDialog {...dialogProps} />
//
// action tự bắt lỗi của nó (ví dụ hiện lỗi lên trang). Chạy xong (thành công hay lỗi) thì popup đóng.
export function useConfirm() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  function askConfirm(options) {
    setState(options);
  }

  function handleCancel() {
    if (!busy) {
      setState(null);
    }
  }

  async function handleConfirm() {
    if (!state) {
      return;
    }
    setBusy(true);
    try {
      await state.action();
    } finally {
      setBusy(false);
      setState(null);
    }
  }

  return {
    askConfirm: askConfirm,
    dialogProps: {
      state: state,
      busy: busy,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
