/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Role } from '../types';
import { GraduationCap, ShieldCheck, UserCheck, Award, Briefcase, Settings } from 'lucide-react';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md' | 'lg';
}

export function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const sizeClasses = isSm
    ? 'text-xs px-2 py-0.5 gap-1'
    : isLg
    ? 'text-base px-4 py-1.5 gap-2'
    : 'text-sm px-2.5 py-1 gap-1.5';

  const iconSize = isSm ? 12 : isLg ? 18 : 14;

  let badgeStyles = '';
  let Icon = GraduationCap;

  switch (role) {
    case 'Student':
      badgeStyles = 'bg-blue-950/40 text-blue-300 border border-blue-900/50';
      Icon = GraduationCap;
      break;
    case 'Dept Staff':
      badgeStyles = 'bg-amber-950/40 text-amber-300 border border-amber-900/50';
      Icon = Briefcase;
      break;
    case 'HOD':
      badgeStyles = 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50';
      Icon = UserCheck;
      break;
    case 'Dean':
      badgeStyles = 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/50';
      Icon = Award;
      break;
    case 'Principal':
      badgeStyles = 'bg-rose-950/40 text-rose-300 border border-rose-900/50';
      Icon = ShieldCheck;
      break;
    case 'Software Admin':
      badgeStyles = 'bg-purple-950/40 text-purple-300 border border-purple-900/50';
      Icon = Settings;
      break;
  }

  return (
    <span
      id={`badge-${role.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses} ${badgeStyles}`}
    >
      <Icon size={iconSize} className="shrink-0" />
      <span>{role}</span>
    </span>
  );
}
