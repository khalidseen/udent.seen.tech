import { memo, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useStableCallback } from "@/hooks/useStableCallback";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchInput = memo<SearchInputProps>(
  ({ value, onChange, placeholder = "بحث...", debounceMs = 300, className }) => {
    const debouncedValue = useDebouncedValue(value, debounceMs);

    const handleChange = useStableCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    });

    return (
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={className}
          style={{ paddingRight: "2.5rem" }}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
