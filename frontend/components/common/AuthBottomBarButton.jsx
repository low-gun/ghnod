export default function AuthBottomBarButton({
    label,
    disabled,
    form,
    className = "",
    onClick,
    type = "submit"
  }) {
    return (
      <div className="auth-bottom-bar mobile-only">
        <button
          type={type}
          className={`auth-bottom-btn ${className}`}
          disabled={disabled}
          form={form}
          onClick={onClick}
        >
          {label}
        </button>
      </div>
    );
  }
  