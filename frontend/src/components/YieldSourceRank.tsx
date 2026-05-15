// Drag-rank for yield_source preference. Sends a list[YieldSource] up to
// FormView.onChange, which posts it as form.yield_source_ranking. Backend
// (app/main.py) converts the ranking into a 16d target vector and routes
// through multi_vector_prefetch with a yield_source-weighted lens mix.

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { YieldSource } from "../types";

const DEFAULT_RANKING: YieldSource[] = [
  "real_yield",
  "lending_spread",
  "amm_fees",
  "points_airdrop",
  "options_premium",
];

const LABELS: Record<YieldSource, string> = {
  real_yield: "Real yield (T-bills, RWA coupons)",
  lending_spread: "Lending spread",
  amm_fees: "AMM swap fees",
  options_premium: "Options premium",
  points_airdrop: "Points / airdrops",
  emissions: "Token emissions",
  mev_capture: "MEV capture",
  basis_trade: "Basis trade (perp funding)",
  restaking_reward: "Restaking reward",
  stablecoin_issuance: "Stablecoin issuance",
  validator_commission: "Validator commission",
};

interface Props {
  ranking: YieldSource[];
  onChange: (next: YieldSource[]) => void;
}

interface SortableItemProps {
  id: YieldSource;
  index: number;
}

function SortableItem({ id, index }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-3 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-emerald-500 active:cursor-grabbing"
    >
      <span className="text-zinc-500 select-none">≡</span>
      <span className="w-6 text-right font-mono text-xs text-zinc-500">{index + 1}.</span>
      <span>{LABELS[id]}</span>
    </div>
  );
}

export default function YieldSourceRank({ ranking, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const items = ranking.length > 0 ? ranking : DEFAULT_RANKING;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as YieldSource);
      const newIndex = items.indexOf(over.id as YieldSource);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <div className="text-sm text-zinc-200">Where should your yield come from? · optional</div>
          <div className="text-xs text-zinc-500">
            {ranking.length === 0
              ? "Skip - or drag to rank your preferred sources of yield (real cash flow, fees, points, etc.)."
              : `Top: ${LABELS[items[0]]}`}
          </div>
        </div>
        <span className="text-zinc-400">{open ? "▼" : "▶"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-zinc-800 px-4 pb-4 pt-3">
          <p className="text-xs text-zinc-500">
            Drag to reorder. The kind of yield at the top will pull the recommendations toward
            protocols whose returns come from that source. "Real yield" means cash flows from
            actual revenue (loan interest, T-bill coupons); "points / airdrops" means speculative
            future token rewards.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((id, i) => (
                  <SortableItem key={id} id={id} index={i} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
