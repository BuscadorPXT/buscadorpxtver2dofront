import { useState, useMemo } from 'react';
import { Check, X, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

const MultiSelectFilter = ({ 
  label, 
  icon: Icon, 
  options = [], 
  selectedValues = [], 
  onChange,
  placeholder = "Buscar...",
  emptyText = "Nenhum item encontrado",
  unavailableOptions = []
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({});

  const isGrouped = options && typeof options === 'object' && options.groups;
  const groups = isGrouped ? options.groups : [{ title: '', options: options || [] }];

  const optionsWithCount = useMemo(() => {
    const allOpts = [];
    groups.forEach(group => {
      group.options.forEach(opt => {
        if (typeof opt === 'string') {
          allOpts.push({ value: opt, label: opt, count: 0, group: group.title, available: true });
        } else {
          allOpts.push({ ...opt, group: group.title, available: true });
        }
      });
    });

    unavailableOptions.forEach(opt => {
      const optValue = typeof opt === 'string' ? opt : opt.value;
      const optLabel = typeof opt === 'string' ? opt : opt.label;

      if (!allOpts.find(o => o.value === optValue)) {
        allOpts.push({
          value: optValue,
          label: optLabel,
          count: 0,
          group: groups[0]?.title || '',
          available: false
        });
      }
    });
    
    return allOpts;
  }, [groups, unavailableOptions]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return optionsWithCount;
    return optionsWithCount.filter(opt => 
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [optionsWithCount, searchTerm]);

  const availableOptions = optionsWithCount.filter(opt => opt.available);
  const allSelected = selectedValues.length === availableOptions.length;
  const someSelected = selectedValues.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(availableOptions.map(opt => opt.value));
    }
  };

  const handleToggle = (value, available) => {

    if (!available) return;
    
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newSelected);
  };

  const handleClear = () => {
    onChange([]);
    setSearchTerm('');
  };

  const handleClose = () => {
    setOpen(false);
    setSearchTerm('');
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0 || allSelected) {
      return `Todas as ${label}`;
    }
    if (selectedValues.length === 1) {
      const selected = optionsWithCount.find(opt => opt.value === selectedValues[0]);
      return selected?.label || selectedValues[0];
    }
    return `${selectedValues.length} selecionados`;
  };

  const hasSelection = selectedValues.length > 0 && !allSelected;
  const buttonClasses = hasSelection 
    ? "h-10 px-2 sm:px-3 text-xs font-normal w-full justify-between border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900" 
    : "h-10 px-2 sm:px-3 text-xs font-normal w-full justify-between border-border hover:bg-accent";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={buttonClasses}
        >
          <span className="truncate text-left flex-1">
            {getDisplayText()}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">

        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">{label}</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        </div>

        <div className="p-2">

          <div className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm">
            <Checkbox
              id="select-all"
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer flex-1"
            >
              Selecionar Tudo
            </label>
          </div>

          <Separator className="my-2" />

          <ScrollArea className="h-64">
            <div className="space-y-1">
              {filteredOptions.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {emptyText}
                </div>
              ) : (
                groups.map((group, groupIndex) => {
                  const groupOptions = filteredOptions.filter(opt => opt.group === group.title);
                  if (groupOptions.length === 0) return null;

                  const isExpanded = expandedGroups[group.title] !== false;
                  const availableGroupOpts = groupOptions.filter(o => o.available);
                  const selectedInGroup = availableGroupOpts.filter(o => selectedValues.includes(o.value));
                  const allGroupSelected = availableGroupOpts.length > 0 && selectedInGroup.length === availableGroupOpts.length;
                  const someGroupSelected = selectedInGroup.length > 0 && !allGroupSelected;

                  const handleGroupToggle = () => {
                    if (allGroupSelected) {
                      onChange(selectedValues.filter(v => !availableGroupOpts.map(o => o.value).includes(v)));
                    } else {
                      const newValues = new Set([...selectedValues, ...availableGroupOpts.map(o => o.value)]);
                      onChange(Array.from(newValues));
                    }
                  };

                  return (
                    <div key={group.title || `group-${groupIndex}`}>
                      {group.title && (
                        <div
                          className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer select-none"
                          onClick={() => setExpandedGroups(prev => ({ ...prev, [group.title]: !isExpanded }))}
                        >
                          <Checkbox
                            checked={allGroupSelected}
                            onCheckedChange={handleGroupToggle}
                            onClick={(e) => e.stopPropagation()}
                            className={someGroupSelected ? "data-[state=unchecked]:bg-primary/20 data-[state=unchecked]:border-primary" : ""}
                          />
                          <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">
                            {group.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {selectedInGroup.length}/{availableGroupOpts.length}
                          </span>
                        </div>
                      )}
                      {(isExpanded || !group.title) && groupOptions.map((option) => (
                        <div
                          key={option.value}
                          className={`flex items-center space-x-2 p-2 rounded-sm ${group.title ? 'ml-6' : 'ml-2'} ${
                            option.available
                              ? 'hover:bg-accent cursor-pointer'
                              : 'opacity-40 cursor-not-allowed'
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (option.available) {
                              handleToggle(option.value, option.available);
                            }
                          }}
                          title={!option.available ? 'Cor indisponível no momento' : ''}
                        >
                          <Checkbox
                            checked={selectedValues.includes(option.value)}
                            disabled={!option.available}
                            onCheckedChange={(checked) => {
                              if (option.available) {
                                handleToggle(option.value, option.available);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <span className={`text-sm truncate uppercase ${!option.available ? 'line-through' : ''}`}>
                              {option.label}
                              {!option.available && (
                                <span className="ml-1 text-xs italic normal-case">(indisponível)</span>
                              )}
                            </span>
                            {option.count > 0 && option.available && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({option.count})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {groupIndex < groups.length - 1 && <Separator className="my-2" />}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />
        <div className="p-3 flex justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs"
          >
            Limpar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs"
          >
            Fechar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectFilter;
