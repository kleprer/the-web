import { ReactNode } from 'react';
import { TimelineEvent, AppFile, Investigation, User } from './index';

export interface AuthFormProps {
  isLogin: boolean;
  onSwitchMode: () => void;
}

export interface ButtonFilledProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  [key: string]: any;
}

export interface ButtonOutlineProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  [key: string]: any;
}

export interface InputFieldProps {
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  className?: string;
  [key: string]: any;
}

export interface CaseCardProps {
  id: string;
  title?: string;
  articleUrl?: string;
  date?: string;
  trustLevel?: 'high' | 'low' | 'unknown';
  className?: string;
  position?: { x: number; y: number };
  onEdit?: (id: string, data: any) => void;
  onEditStart?: (id: string) => void;
  onEditEnd?: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, isMultiSelect?: boolean) => void;
  isEditing?: boolean;
  [key: string]: any;
}

export interface CaseSelectorProps {
  currentCase: string;
  onCaseChange: (caseName: string) => void;
}

export interface ConnectionLineProps {
  start: { x: number; y: number };
  end: { x: number; y: number };
  isTemp?: boolean;
}

export interface DraggableImageProps {
  id: string;
  url: string;
  position: { x: number; y: number };
  className?: string;
  onEdit?: (id: string, data: any) => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  isConnectingMode?: boolean;
  onSelect?: (id: string, isMultiSelect?: boolean) => void;
  [key: string]: any;
}

export interface DraggableTextProps {
  id: string;
  content: string;
  position: { x: number; y: number };
  className?: string;
  onEdit?: (id: string, data: any) => void;
  onEditStart?: (id: string) => void;
  onEditEnd?: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, isMultiSelect?: boolean) => void;
  isEditing?: boolean;
  [key: string]: any;
}

export interface EditEventFormProps {
  event: TimelineEvent;
  onUpdate: (eventId: number, eventData: any) => Promise<void>;
  onCancel: () => void;
}

export interface EmptyTimelineProps {
  onAddEvent: () => void;
}

export interface EvidenceCardProps {
  file: AppFile;
  onDelete: () => void;
}

export interface ExportFormProps {
  evidences: AppFile[];
  investigation?: Investigation | null;
  onClose: () => void;
  onExport: (selectedFiles: any[]) => void;
}

export interface NavbarProps {
  currentBoardName?: string;
}

export interface UserDropdownProps {
  userData: User;
  onLogout: () => void;
}

export interface BoardDropdownProps {
  currentBoardName: string;
  boards: Investigation[];
  currentBoardId: string;
  loading: boolean;
}

export interface NewEventFormProps {
  onAddEvent: (eventData: any) => Promise<void>;
  onCancel: () => void;
}

export interface ProtectedRouteProps {
  children: ReactNode;
}

export interface TimelineEventProps {
  event: TimelineEvent;
  position: number;
  onEdit?: (event: TimelineEvent) => void;
  onDelete?: (eventId: number) => void;
}

export interface ToolbarProps {
  onSelectArea: () => void;
  onMoveCanvas: () => void;
  onAddCard: () => void;
  onAddText: () => void;
  onConnect: () => void;
  onAddPhoto: () => void;
  isMovingCanvas?: boolean;
}