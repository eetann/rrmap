import { type CSSProperties, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface ComboboxOption {
  value: string;
  label: string;
}

export function Combobox({
  value,
  options,
  onChange,
  placeholder = "選択",
  searchPlaceholder = "検索",
  emptyText = "見つかりません",
  searchable = true,
  ariaLabel,
  className,
  style,
  contentClassName,
}: {
  value: string;
  options: ComboboxOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  searchable?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          "flex cursor-pointer items-center justify-between gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        style={style}
      >
        <span className={cn("truncate", selected === undefined && "text-muted-foreground")}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon className="flex-shrink-0 opacity-60" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        onEscapeKeyDown={(e) => {
          // Radixはキャプチャ段階でEscapeを拾うので、ここでpreventDefaultしておくと
          // 外側のEscapeハンドラ（サイドピークを閉じる等）はdefaultPreventedで無視できる
          e.preventDefault();
          setOpen(false);
        }}
        className={cn("w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0", contentClassName)}
      >
        <Command>
          {searchable && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // valueはIDなので、タイトルでも絞り込めるようkeywordsに渡す
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.value === value && <CheckIcon className="text-foreground" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
