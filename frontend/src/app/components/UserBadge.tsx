interface UserBadgeProps {
  displayName: string;
  handle: string;
  isBot: boolean;
  botLabel?: string;
}

export function UserBadge({ displayName, handle, isBot, botLabel }: UserBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-sm font-semibold text-white">{displayName}</span>
      <span className="text-xs text-[#666666]">{handle}</span>
      {isBot && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#7c4dff] text-white rounded-sm">
          {botLabel ?? "BOT"}
        </span>
      )}
    </span>
  );
}
