import React from "react"

interface Column {
	key: string
	label: string
}

interface Row {
	[key: string]: string | number
}

interface DynamicTableProps {
	columns: Column[]
	data: Row[]
}

const DynamicTable: React.FC<DynamicTableProps> = ({ columns, data }) => {
	return (
		<div className="overflow-y-auto max-h-[70vh]">
			<table className="w-full text-left mt-4">
				<thead>
					<tr>
						{columns.map((column) => (
							<th key={column.key}>{column.label}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.map((row, index) => (
						<tr key={index}>
							{columns.map((column) => (
								<td key={column.key}>{row[column.key]}</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default DynamicTable
