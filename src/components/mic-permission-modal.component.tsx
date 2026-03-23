export function SessionPermissionModal({
  onEnter,
  onDecline,
}: {
  onEnter: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <h3 className="mb-2 text-lg font-bold">Live Session</h3>
        <p className="text-base-content/70 mb-6 text-sm">
          Join the remote session to collaborate with others in real-time. Your
          microphone will be used for live voice interactions. You can mute your
          microphone at any time.
        </p>
        <div className="modal-action flex-col gap-2">
          <button className="btn btn-primary w-full" onClick={onEnter}>
            Enter Session
          </button>
          <button className="btn btn-ghost btn-sm w-full" onClick={onDecline}>
            I don't want to join session.
          </button>
        </div>
      </div>
    </div>
  );
}
