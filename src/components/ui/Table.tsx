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
    <div className={`overflow-x-auto w-full border border-[#262833] rounded-xl bg-[#181920] ${className}`}>
      <table className="min-w-full divide-y divide-[#262833] text-left">
        <thead className="bg-[#121318] text-slate-400 text-xs font-semibold tracking-wider">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#262833] text-xs text-slate-200 bg-[#181920]">
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
      className={`hover:bg-[#20222c] transition-colors ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
    <td colSpan={colSpan} className={`px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </td>
  );
};
