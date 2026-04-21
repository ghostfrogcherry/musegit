"use client";

import { useState } from "react";
import type { Account } from "@/lib/domain";

type Member = Account & { workspace_role?: string };

type MembersPanelProps = {
  workspaceSlug: string;
  initialMembers: Member[];
  currentUserId: number;
};

export function MembersPanel({ workspaceSlug, initialMembers, currentUserId }: MembersPanelProps) {
  const [members, setMembers] = useState(initialMembers);
  const [isOpen, setIsOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentMember = members.find(m => m.id === currentUserId);
  const isManager = currentMember?.workspace_role === "manager" || currentMember?.role === "Admin";

  async function handleInvite() {
    if (!inviteInput.trim()) return;
    
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: inviteInput.trim() })
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to invite");
        return;
      }

      const membersRes = await fetch(`/api/workspaces/${workspaceSlug}/members`);
      const membersData = await membersRes.json();
      setMembers(membersData.members);
      setInviteInput("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: number) {
    setLoading(true);
    
    await fetch(`/api/workspaces/${workspaceSlug}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });

    const membersRes = await fetch(`/api/workspaces/${workspaceSlug}/members`);
    const membersData = await membersRes.json();
    setMembers(membersData.members);
    setLoading(false);
  }

  async function handleRoleChange(userId: number, role: string) {
    await fetch(`/api/workspaces/${workspaceSlug}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role })
    });

    const membersRes = await fetch(`/api/workspaces/${workspaceSlug}/members`);
    const membersData = await membersRes.json();
    setMembers(membersData.members);
  }

  return (
    <article className="panel detailPanel">
      <div className="sectionHeading">
        <h2>Band members</h2>
        <button className="secondaryButton buttonReset inlineButton" onClick={() => setIsOpen(!isOpen)} type="button">
          {isOpen ? "Close" : "Manage"}
        </button>
      </div>

      <div className="membersList">
        {members.map(member => (
          <div key={member.id} className="memberRow">
            <div className="memberInfo">
              <strong>{member.name}</strong>
              <span>@{member.handle}</span>
              {member.workspace_role === "manager" && <span className="memberBadge">Manager</span>}
            </div>
            {isManager && member.id !== currentUserId && (
              <div className="memberActions">
                <select 
                  className="fieldInput" 
                  value={member.workspace_role || "member"}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
                <button 
                  className="secondaryButton buttonReset" 
                  onClick={() => handleRemove(member.id)}
                  disabled={loading}
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isOpen && isManager && (
        <div className="inviteForm topSpace">
          <p className="authLabel">Invite by email or handle</p>
          <div className="inviteRow">
            <input 
              className="fieldInput" 
              placeholder="user@example.com or username"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
            />
            <button 
              className="primaryButton buttonReset" 
              onClick={handleInvite}
              disabled={loading || !inviteInput.trim()}
            >
              Invite
            </button>
          </div>
          {error && <p className="formError">{error}</p>}
        </div>
      )}
    </article>
  );
}