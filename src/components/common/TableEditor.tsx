import React, { useState, useRef, useEffect } from "react"
import { parseMarkdownTable, generateMarkdownTable, updateCell, type TableData } from "~/utils/markdownTable"

interface TableEditorProps {
	mdTable: string
	onChange: (newMd: string) => void
	onEscape?: () => void
}

export const TableEditor: React.FC<TableEditorProps> = ({ mdTable, onChange, onEscape }) => {
	// Parse table data only once at initialization
	const [tableData, setTableData] = useState<TableData | null>(() => parseMarkdownTable(mdTable))
	const [editingCell, setEditingCell] = useState<{ row: number; col: number; isHeader: boolean } | null>(null)
	const [cellValue, setCellValue] = useState("")
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (editingCell && inputRef.current) {
			inputRef.current.focus()
			inputRef.current.select()
		}
	}, [editingCell])

	const handleCellClick = (row: number, col: number, isHeader: boolean = false) => {
		// Don't start new edit if already editing
		if (editingCell) return

		const value = isHeader ? tableData?.headers[col] || "" : tableData?.rows[row]?.[col] || ""
		setCellValue(value)
		setEditingCell({ row, col, isHeader })
	}

	const handleCellChange = (value: string) => {
		setCellValue(value)
	}

	const handleCellSave = () => {
		if (editingCell && tableData) {
			const newData = updateCell(tableData, editingCell.row, editingCell.col, cellValue, editingCell.isHeader)
			setTableData(newData)
			onChange(generateMarkdownTable(newData))
		}
		setEditingCell(null)
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault()
			handleCellSave()
		} else if (e.key === "Tab") {
			e.preventDefault()
			handleCellSave()
		} else if (e.key === "Escape") {
			e.preventDefault()
			// Cancel edit without saving
			setEditingCell(null)
			setCellValue("")
			if (onEscape) {
				onEscape()
			}
		}
	}

	if (!tableData) {
		return <div className="text-sm text-gray-500 p-4">Unable to parse table. Please check the markdown format.</div>
	}

	return (
		<div className="table-editor-container">
			{/* Table */}
			<div className="overflow-x-auto border border-gray-200 rounded-md">
				<table className="min-w-full">
					<thead>
						<tr className="bg-gray-50 border-b border-gray-200">
							{tableData.headers.map((header, colIndex) => (
								<th
									key={`h-${colIndex}`}
									onClick={() => !editingCell && handleCellClick(0, colIndex, true)}
									className={`px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 ${
										tableData.alignments[colIndex] === "center"
											? "text-center"
											: tableData.alignments[colIndex] === "right"
											? "text-right"
											: "text-left"
									}`}
								>
									{editingCell?.isHeader && editingCell.col === colIndex ? (
										<input
											ref={inputRef}
											type="text"
											value={cellValue}
											onChange={(e) => handleCellChange(e.target.value)}
											onBlur={handleCellSave}
											onKeyDown={handleKeyDown}
											className="w-full px-1 py-0.5 border border-blue-400 rounded outline-none focus:border-blue-500 bg-white text-xs"
											onClick={(e) => e.stopPropagation()}
										/>
									) : (
										header || <span className="text-gray-400">Empty</span>
									)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{tableData.rows.length === 0 ? (
							<tr>
								<td
									colSpan={tableData.headers.length}
									className="px-3 py-8 text-center text-sm text-gray-500"
								>
									No data rows.
								</td>
							</tr>
						) : (
							tableData.rows.map((row, rowIndex) => (
								<tr key={`r-${rowIndex}`} className="border-b border-gray-100 hover:bg-gray-50">
									{row.map((cell, colIndex) => (
										<td
											key={`c-${rowIndex}-${colIndex}`}
											onClick={() => !editingCell && handleCellClick(rowIndex, colIndex)}
											className={`px-3 py-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 ${
												tableData.alignments[colIndex] === "center"
													? "text-center"
													: tableData.alignments[colIndex] === "right"
													? "text-right"
													: "text-left"
											}`}
										>
											{editingCell &&
											!editingCell.isHeader &&
											editingCell.row === rowIndex &&
											editingCell.col === colIndex ? (
												<input
													ref={inputRef}
													type="text"
													value={cellValue}
													onChange={(e) => handleCellChange(e.target.value)}
													onBlur={handleCellSave}
													onKeyDown={handleKeyDown}
													className="w-full px-1 py-0.5 border border-blue-400 rounded outline-none focus:border-blue-500 bg-white text-sm"
													onClick={(e) => e.stopPropagation()}
												/>
											) : (
												cell || <span className="text-gray-400">Empty</span>
											)}
										</td>
									))}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
