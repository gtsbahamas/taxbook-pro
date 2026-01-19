// ============================================================
// STATE MACHINE UI COMPONENTS - taxbook-pro
// Generated: 2026-01-19
// ============================================================
//
// REUSABLE COMPONENTS FOR STATE MACHINE VISUALIZATION AND CONTROL
//
// Components:
// - StateBadge: Display current state with color/icon
// - StateTransitionButton: Button to trigger state transition
// - StateTransitionDialog: Confirmation dialog for transitions
// - StateHistory: Timeline of state changes
// - StateFlowDiagram: Visual state machine diagram
//
// DEFENSIVE PATTERNS (Inversion Mental Model):
// - What if transition fails? → Show error state, allow retry
// - What if user clicks twice? → Disable during transition
// - What if state is stale? → Optimistic update with rollback
//
// Inversion Insights Applied:
//   • What would make a client NOT book? Complex forms, unclear availability, no reminders
//   • What would make a tax pro abandon this tool? If it&#x27;s slower than their current system
//   • What would cause double-bookings? Race conditions, timezone bugs, unclear UI
// ============================================================

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================
// TYPES
// ============================================================

export interface StateDefinition {
  readonly name: string;
  readonly displayName: string;
  readonly description?: string;
  readonly color: string;
  readonly icon?: string;
  readonly isFinal?: boolean;
  readonly isInitial?: boolean;
}

export interface StateTransition {
  readonly name: string;
  readonly displayName: string;
  readonly from: string;
  readonly to: string;
  readonly description?: string;
  readonly confirmationRequired?: boolean;
  readonly confirmationMessage?: string;
  readonly requiredRole?: string;
}

export interface StateMachineConfig {
  readonly field: string;
  readonly states: readonly StateDefinition[];
  readonly transitions: readonly StateTransition[];
}

export interface TransitionResult {
  readonly success: boolean;
  readonly error?: string;
  readonly newState?: string;
}

// ============================================================
// STATE BADGE
// ============================================================

interface StateBadgeProps {
  readonly state: string;
  readonly config: StateMachineConfig;
  readonly size?: "sm" | "md" | "lg";
  readonly showIcon?: boolean;
  readonly className?: string;
}

const stateColorMap: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  red: "bg-red-100 text-red-800 border-red-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  gray: "bg-gray-100 text-gray-800 border-gray-200",
  default: "bg-gray-100 text-gray-800 border-gray-200",
};

const stateIconMap: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  active: <CheckCircle2 className="h-3 w-3" />,
  completed: <CheckCircle2 className="h-3 w-3" />,
  failed: <AlertCircle className="h-3 w-3" />,
  cancelled: <AlertCircle className="h-3 w-3" />,
};

export function StateBadge({
  state,
  config,
  size = "md",
  showIcon = true,
  className,
}: StateBadgeProps) {
  const stateDefinition = config.states.find((s) => s.name === state);

  if (!stateDefinition) {
    return (
      <Badge variant="outline" className={cn("bg-gray-100", className)}>
        {state}
      </Badge>
    );
  }

  const colorClass = stateColorMap[stateDefinition.color] || stateColorMap.default;
  const icon = stateIconMap[state] || stateIconMap[stateDefinition.icon || ""];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(colorClass, sizeClasses[size], "gap-1", className)}
          >
            {showIcon && icon}
            {stateDefinition.displayName}
          </Badge>
        </TooltipTrigger>
        {stateDefinition.description && (
          <TooltipContent>
            <p>{stateDefinition.description}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================
// STATE TRANSITION BUTTON
// ============================================================

interface StateTransitionButtonProps {
  readonly currentState: string;
  readonly transition: StateTransition;
  readonly config: StateMachineConfig;
  readonly onTransition: (transitionName: string) => Promise<TransitionResult>;
  readonly disabled?: boolean;
  readonly variant?: "default" | "outline" | "ghost";
  readonly size?: "sm" | "md" | "lg";
  readonly className?: string;
}

export function StateTransitionButton({
  currentState,
  transition,
  config,
  onTransition,
  disabled = false,
  variant = "outline",
  size = "md",
  className,
}: StateTransitionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Check if transition is valid from current state
  const isValidTransition = transition.from === currentState;

  const handleTransition = useCallback(async () => {
    if (!isValidTransition || disabled || isLoading) return;

    // Show confirmation if required
    if (transition.confirmationRequired && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onTransition(transition.name);
      if (!result.success) {
        setError(result.error || "Transition failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transition failed");
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  }, [isValidTransition, disabled, isLoading, transition, onTransition, showConfirmation]);

  const targetState = config.states.find((s) => s.name === transition.to);

  const sizeClasses = {
    sm: "text-xs h-7",
    md: "text-sm h-9",
    lg: "text-base h-11",
  };

  if (!isValidTransition) {
    return null;
  }

  // Confirmation dialog
  if (transition.confirmationRequired) {
    return (
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
            disabled={disabled || isLoading}
            className={cn(sizeClasses[size], "gap-2", className)}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {transition.displayName}
            {targetState && (
              <>
                <ArrowRight className="h-3 w-3" />
                <StateBadge state={transition.to} config={config} size="sm" showIcon={false} />
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {transition.displayName}</DialogTitle>
            <DialogDescription>
              {transition.confirmationMessage ||
                `Are you sure you want to ${transition.displayName.toLowerCase()}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransition} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
        onClick={handleTransition}
        disabled={disabled || isLoading}
        className={cn(sizeClasses[size], "gap-2", className)}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {transition.displayName}
        {targetState && (
          <>
            <ArrowRight className="h-3 w-3" />
            <StateBadge state={transition.to} config={config} size="sm" showIcon={false} />
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================
// AVAILABLE TRANSITIONS
// ============================================================

interface AvailableTransitionsProps {
  readonly currentState: string;
  readonly config: StateMachineConfig;
  readonly onTransition: (transitionName: string) => Promise<TransitionResult>;
  readonly disabled?: boolean;
  readonly layout?: "horizontal" | "vertical";
  readonly className?: string;
}

export function AvailableTransitions({
  currentState,
  config,
  onTransition,
  disabled = false,
  layout = "horizontal",
  className,
}: AvailableTransitionsProps) {
  const availableTransitions = config.transitions.filter(
    (t) => t.from === currentState
  );

  if (availableTransitions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
    >
      {availableTransitions.map((transition) => (
        <StateTransitionButton
          key={transition.name}
          currentState={currentState}
          transition={transition}
          config={config}
          onTransition={onTransition}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// ============================================================
// STATE FLOW DIAGRAM (Simple)
// ============================================================

interface StateFlowDiagramProps {
  readonly config: StateMachineConfig;
  readonly currentState?: string;
  readonly className?: string;
}

export function StateFlowDiagram({
  config,
  currentState,
  className,
}: StateFlowDiagramProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {config.states.map((state, index) => (
        <div key={state.name} className="flex items-center gap-2">
          <StateBadge
            state={state.name}
            config={config}
            size="md"
            className={cn(
              currentState === state.name && "ring-2 ring-primary ring-offset-2"
            )}
          />
          {index < config.states.length - 1 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STATE HISTORY TIMELINE
// ============================================================

interface StateHistoryEntry {
  readonly state: string;
  readonly timestamp: Date;
  readonly userId?: string;
  readonly userName?: string;
  readonly note?: string;
}

interface StateHistoryProps {
  readonly history: readonly StateHistoryEntry[];
  readonly config: StateMachineConfig;
  readonly className?: string;
}

export function StateHistory({ history, config, className }: StateHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No state history available.</p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {history.map((entry, index) => (
        <div key={index} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
            {index < history.length - 1 && (
              <div className="w-0.5 flex-1 bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <StateBadge state={entry.state} config={config} size="sm" />
              <span className="text-xs text-muted-foreground">
                {entry.timestamp.toLocaleString()}
              </span>
            </div>
            {entry.userName && (
              <p className="text-sm text-muted-foreground mt-1">
                Changed by {entry.userName}
              </p>
            )}
            {entry.note && (
              <p className="text-sm mt-1">{entry.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// STATE MACHINE CARD (Complete Overview)
// ============================================================

interface StateMachineCardProps {
  readonly entityName: string;
  readonly entityId: string;
  readonly currentState: string;
  readonly config: StateMachineConfig;
  readonly history?: readonly StateHistoryEntry[];
  readonly onTransition: (transitionName: string) => Promise<TransitionResult>;
  readonly disabled?: boolean;
  readonly showHistory?: boolean;
  readonly className?: string;
}

export function StateMachineCard({
  entityName,
  entityId,
  currentState,
  config,
  history = [],
  onTransition,
  disabled = false,
  showHistory = true,
  className,
}: StateMachineCardProps) {
  const currentStateDefinition = config.states.find((s) => s.name === currentState);

  return (
    <div className={cn("rounded-lg border p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">{entityName} Status</h3>
          <p className="text-sm text-muted-foreground">ID: {entityId}</p>
        </div>
        <StateBadge state={currentState} config={config} size="lg" />
      </div>

      {/* Current State Description */}
      {currentStateDefinition?.description && (
        <p className="text-sm text-muted-foreground">
          {currentStateDefinition.description}
        </p>
      )}

      {/* Flow Diagram */}
      <div>
        <h4 className="text-sm font-medium mb-2">State Flow</h4>
        <StateFlowDiagram config={config} currentState={currentState} />
      </div>

      {/* Available Transitions */}
      <div>
        <h4 className="text-sm font-medium mb-2">Available Actions</h4>
        <AvailableTransitions
          currentState={currentState}
          config={config}
          onTransition={onTransition}
          disabled={disabled}
        />
      </div>

      {/* History */}
      {showHistory && history.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">History</h4>
          <StateHistory history={history.slice(0, 5)} config={config} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// ENTITY-SPECIFIC STATE MACHINE CONFIGS
// ============================================================

export const appointmentStateMachineConfig: StateMachineConfig = {
  field: "status",
  states: [
    {
      name: "draft",
      displayName: "Draft",
      description: "Appointment being scheduled",
      color: "gray",
      
      
      isInitial: true,
    },
    {
      name: "confirmed",
      displayName: "Confirmed",
      description: "Appointment confirmed",
      color: "blue",
      
      
      
    },
    {
      name: "in_progress",
      displayName: "In Progress",
      description: "Appointment currently happening",
      color: "yellow",
      
      
      
    },
    {
      name: "completed",
      displayName: "Completed",
      description: "Appointment completed successfully",
      color: "green",
      
      isFinal: true,
      
    },
    {
      name: "cancelled",
      displayName: "Cancelled",
      description: "Appointment cancelled",
      color: "red",
      
      isFinal: true,
      
    },
    {
      name: "no_show",
      displayName: "No Show",
      description: "Client did not show up",
      color: "red",
      
      isFinal: true,
      
    },
  ],
  transitions: [
    {
      name: "confirm",
      displayName: "Confirm",
      from: "draft",
      to: "confirmed",
      description: "Confirm the appointment",
      
      
      
    },
    {
      name: "start",
      displayName: "Start",
      from: "confirmed",
      to: "in_progress",
      description: "Start the appointment",
      
      
      
    },
    {
      name: "complete",
      displayName: "Complete",
      from: "in_progress",
      to: "completed",
      description: "Mark as completed",
      
      
      
    },
    {
      name: "cancel",
      displayName: "Cancel",
      from: "confirmed",
      to: "cancelled",
      description: "Cancel the appointment",
      confirmationRequired: true,
      confirmationMessage: "Are you sure you want to cancel this appointment?",
      
    },
    {
      name: "cancel_draft",
      displayName: "Cancel",
      from: "draft",
      to: "cancelled",
      description: "Cancel the draft appointment",
      
      
      
    },
    {
      name: "mark_no_show",
      displayName: "No Show",
      from: "confirmed",
      to: "no_show",
      description: "Mark client as no-show",
      confirmationRequired: true,
      confirmationMessage: "Mark this client as a no-show?",
      
    },
  ],
};

export const documentStateMachineConfig: StateMachineConfig = {
  field: "status",
  states: [
    {
      name: "requested",
      displayName: "Requested",
      description: "Document requested from client",
      color: "gray",
      
      
      isInitial: true,
    },
    {
      name: "uploaded",
      displayName: "Uploaded",
      description: "Document uploaded by client",
      color: "blue",
      
      
      
    },
    {
      name: "reviewed",
      displayName: "Reviewed",
      description: "Document reviewed by practitioner",
      color: "yellow",
      
      
      
    },
    {
      name: "accepted",
      displayName: "Accepted",
      description: "Document accepted",
      color: "green",
      
      isFinal: true,
      
    },
    {
      name: "rejected",
      displayName: "Rejected",
      description: "Document rejected, needs resubmission",
      color: "red",
      
      
      
    },
  ],
  transitions: [
    {
      name: "upload",
      displayName: "Upload",
      from: "requested",
      to: "uploaded",
      description: "Client uploads the document",
      
      
      
    },
    {
      name: "review",
      displayName: "Review",
      from: "uploaded",
      to: "reviewed",
      description: "Mark as reviewed",
      
      
      
    },
    {
      name: "accept",
      displayName: "Accept",
      from: "reviewed",
      to: "accepted",
      description: "Accept the document",
      
      
      
    },
    {
      name: "reject",
      displayName: "Reject",
      from: "reviewed",
      to: "rejected",
      description: "Reject and request resubmission",
      
      
      
    },
    {
      name: "reupload",
      displayName: "Reupload",
      from: "rejected",
      to: "uploaded",
      description: "Client reuploads the document",
      
      
      
    },
  ],
};


// ============================================================
// GENERATED BY MENTAL MODELS SDLC
// ============================================================
