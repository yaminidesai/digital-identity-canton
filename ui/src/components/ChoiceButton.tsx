import { useConfirm } from './ConfirmDialog';

interface ChoiceButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
  variant?: 'primary' | 'success' | 'danger' | 'secondary';
  small?: boolean;
  confirm?: string;
}

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
};

export function ChoiceButton({
  label,
  onClick,
  loading = false,
  variant = 'primary',
  small = false,
  confirm: confirmMessage,
}: ChoiceButtonProps) {
  const { confirm } = useConfirm();

  const handleClick = async () => {
    if (confirmMessage) {
      const ok = await confirm({
        title: label,
        message: confirmMessage,
        confirmLabel: label,
        confirmVariant: variant === 'danger' ? 'danger' : 'primary',
      });
      if (!ok) return;
    }
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${variants[variant]} rounded font-medium disabled:opacity-50 ${
        small ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      {loading ? 'Processing...' : label}
    </button>
  );
}
