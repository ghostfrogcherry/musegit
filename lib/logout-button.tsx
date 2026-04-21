"use client";

import { usePlayer } from "@/lib/player-context";

type LogoutButtonProps = {
  children: React.ReactNode;
  action: () => void;
};

export function LogoutButton({ children, action }: LogoutButtonProps) {
  const { stop } = usePlayer();

  async function handleClick(e: React.FormEvent) {
    e.preventDefault();
    stop();
    await action();
  }

  return (
    <form onSubmit={handleClick}>
      {children}
    </form>
  );
}