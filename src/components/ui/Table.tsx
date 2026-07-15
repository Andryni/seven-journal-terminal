import React from 'react';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  headers,
  children,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto w-full border border-bloomberg-border rounded-sm ${className}`}>
      <table className="min-w-full divide-y divide-bloomberg-border text-left font-mono">
        <thead className="bg-bloomberg-surface text-bloomberg-text-secondary text-[10px] uppercase tracking-wider">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bloomberg-border/50 text-xs text-bloomberg-text-primary bg-bloomberg-bg tabular-nums">
          {children}
        </tbody>
      </table>
    </div>
  );
};

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <tr
      className={`hover:bg-bloomberg-surface/40 transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  colSpan,
}) => {
  return (
    <td colSpan={colSpan} className={`px-4 py-2.5 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
};
