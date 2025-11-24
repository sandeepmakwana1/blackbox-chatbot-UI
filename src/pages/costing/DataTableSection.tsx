import React, { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Input } from "~/components/ui/input"
import { DollarSign, User, Dot, Package, Server, DotIcon, Trash2 } from "lucide-react"
import { ArrowRight2, DiscountShape, Document, TableDocument } from "iconsax-reactjs"
import { useCostingStore } from "~/store/costingStore"
import { truncateText } from "~/lib/utils"
import { Badge } from "~/components/ui/badge"

//--- EditableCell Component ---
interface EditableCellProps {
	value: any
	onChange: (value: string) => void
	onSave: () => void
	onCancel: () => void
}
const EditableCell: React.FC<EditableCellProps> = ({ value, onChange, onSave, onCancel }) => {
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") onSave()
		else if (e.key === "Escape") onCancel()
	}
	return (
		<Input
			className="h-full p-2 bg-white text-sm text-neutral-900"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={handleKeyDown}
			onBlur={onSave}
			autoFocus
		/>
	)
}

//--- SummaryBar Component ---
interface SummaryBarProps {
	tabId: string
	rows: Array<Record<string, any>>
}
const SummaryBar: React.FC<SummaryBarProps> = ({ tabId, rows }) => {
	const totals = useMemo(() => {
		const result = { humanResources: 0, licenses: 0, infraMonthly: 0, infraAnnual: 0 }
		for (const row of rows) {
			if (tabId === "human-resources") result.humanResources += Number(row.cost) || 0
			else if (tabId === "licenses") result.licenses += Number(row.total_investment) || 0
			else if (tabId === "infrastructure") {
				result.infraMonthly += Number(row.monthly_cost) || 0
				result.infraAnnual += Number(row.annual_cost) || 0
			}
		}
		return result
	}, [rows, tabId])
	if (tabId === "human-resources") {
		return (
			<div className="flex w-full items-center justify-between px-3.5 py-2.5 bg-success-200 rounded-lg">
				<div className="flex items-center gap-4">
					<div className="flex items-center rounded-md bg-success-500 p-2">
						<DollarSign size={14} color="#ffffff" />
					</div>
					<span className="text-success-500 text-sm font-semibold">Total project labor investment</span>
				</div>
				<div className="text-success-500 text-base font-semibold">
					$ {totals.humanResources.toLocaleString()}
				</div>
			</div>
		)
	}
	if (tabId === "licenses") {
		return (
			<div className="flex w-full items-center justify-between px-3.5 py-2.5 bg-success-200 rounded-lg">
				<div className="flex items-center gap-4">
					<div className="flex items-center rounded-md bg-success-500 p-2">
						<DollarSign size={14} color="#ffffff" />
					</div>
					<span className="text-success-500 text-sm font-semibold">Total Investment</span>
				</div>
				<div className="text-success-500 text-base font-semibold">$ {totals.licenses.toLocaleString()}</div>
			</div>
		)
	}
	if (tabId === "infrastructure") {
		return (
			<div className="flex w-full rounded-lg overflow-hidden gap-2">
				<div className="flex w-1/2 items-center justify-between px-3.5 py-2.5 rounded-lg bg-primary-200">
					<div className="flex items-center gap-4">
						<div className="flex items-center rounded-md bg-primary-500 p-2">
							<DollarSign size={14} color="#ffffff" />
						</div>
						<span className="text-primary-500 text-sm font-semibold">Total monthly investment</span>
					</div>
					<div className="text-primary-500 text-base font-semibold">
						$ {totals.infraMonthly.toLocaleString()}
					</div>
				</div>
				<div className="flex w-1/2 bg-success-200 items-center justify-between px-3.5 py-2.5 rounded-lg">
					<div className="flex items-center gap-4">
						<div className="flex items-center rounded-md bg-success-500 p-2">
							<DollarSign size={14} color="#ffffff" />
						</div>
						<span className="text-success-500 text-sm font-semibold">Total annual investment</span>
					</div>
					<div className="text-success-500 text-base font-semibold">
						$ {totals.infraAnnual.toLocaleString()}
					</div>
				</div>
			</div>
		)
	}
	return null
}

//--- DetailsView and Sub-Components ---
interface DetailsViewProps {
	selectedRow: Record<string, any> | null
	tabId: string
}
const DetailsView: React.FC<DetailsViewProps> = ({ selectedRow, tabId }) => {
	const renderContent = () => {
		if (!selectedRow)
			return (
				<div className="flex items-center justify-center h-full text-gray-500">
					<p>Select a row to view details</p>
				</div>
			)
		switch (tabId) {
			case "human-resources":
				return <HumanResourcesDetails row={selectedRow} />
			case "licenses":
				return <LicensesDetails row={selectedRow} />
			case "infrastructure":
				return <InfrastructureDetails row={selectedRow} />
			default:
				return <p>No details available for this tab.</p>
		}
	}
	return (
		<div className="w-[35%] min-h-[20rem] rounded-lg border border-solid border-neutral-400 bg-white flex flex-col">
			{renderContent()}
		</div>
	)
}
const HumanResourcesDetails: React.FC<{ row: Record<string, any> }> = ({ row }) => {
	return (
		<div className="flex flex-col gap-4 px-4 py-3 max-h-[75vh] overflow-y-auto">
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-[7px] bg-neutral-900 p-1.5">
						<TableDocument size={14} color="#ffffff" />
					</div>

					<p className="text-sm font-normal text-neutral-900">Details</p>
				</div>
				<div className="flex items-center gap-1">
					<Badge variant="primaryTransparent">
						<User />
						{row.name}
					</Badge>
					<Badge variant="warningTransparent" dot>
						{row.level}
					</Badge>
				</div>
			</div>

			{/* 3-Column Grid for Stats */}

			<div className="flex flex-col gap-1">
				<div className="grid grid-cols-3 rounded-[8px] border border-neutral-400">
					<div className="flex flex-col gap-1 px-3 py-2 bg-white">
						<span className="text-xs text-neutral-700">Total hours</span>
						<span className="text-sm font-medium text-neutral-900">{row.hours?.toLocaleString()} Hrs</span>
					</div>
					<div className="flex flex-col gap-1 px-3 py-2 bg-white border-x border-neutral-200">
						<span className="text-xs text-neutral-700">Hourly rate ($)</span>
						<span className="text-sm font-medium text-neutral-900">$ {row.rate?.toLocaleString()}</span>
					</div>
					<div className="flex flex-col gap-1 px-3 py-2 bg-white">
						<span className="text-xs text-neutral-700">Total cost ($)</span>
						<span className="text-sm font-medium text-success-400">$ {row.cost?.toLocaleString()}</span>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-1">
				<p className="text-neutral-700 text-sm">Initial rate suggestions</p>
				<div className="grid grid-cols-3 rounded-[8px] border border-neutral-400  overflow-hidden">
					<div className="flex flex-col gap-6 px-3 py-2 bg-white">
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-primary-300 rounded-[2px]"></div>
							<span className="text-xs text-neutral-700">BlackBox </span>
						</div>
						<div className="flex flex-col ">
							<span className="text-15 font-semibold text-neutral-900">
								$ {row.rate?.toLocaleString()}
							</span>
							<span className="text-xs font-medium text-neutral-700">Per hour</span>
						</div>
					</div>
					<div className="flex flex-col gap-6 px-3 py-2 bg-white border-x border-neutral-400">
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-[#ECD53D] rounded-[2px]"></div>
							<span className="text-xs text-neutral-700">ChatGPT </span>
						</div>
						<div className="flex flex-col ">
							<span className="text-15 font-semibold text-neutral-900">
								$ {row.gpt_hourly_wage?.toLocaleString()}
							</span>
							<span className="text-xs font-medium text-neutral-700">Per hour</span>
						</div>
					</div>
					<div className="flex flex-col gap-6 px-3 py-2 bg-white border-x border-neutral-400">
						<div className="flex items-center gap-1">
							<div className="w-2 h-2 bg-[#E78787] rounded-[2px]"></div>
							<span className="text-xs text-neutral-700">Past reference </span>
						</div>
						<div className="flex flex-col ">
							<span className="text-15 font-semibold text-neutral-900">
								$ {row.GSA_Rates?.toLocaleString()}
							</span>
							<span className="text-xs font-medium text-neutral-700">Per hour</span>
						</div>
					</div>
				</div>
			</div>

			{/* Description Section */}
			{row.description && (
				<div className="flex flex-col gap-0.5">
					<h3 className="text-sm font-medium text-neutral-700">Description</h3>
					<p className="text-sm text-neutral-900 leading-relaxed">{row.description}</p>
				</div>
			)}
		</div>
	)
}
const LicensesDetails: React.FC<{ row: Record<string, any> }> = ({ row }) => {
	return (
		<div className="flex flex-col gap-4 px-4 py-3 max-h-[75vh] overflow-y-auto">
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-[7px] bg-neutral-900 p-1.5">
						<TableDocument size={14} color="#ffffff" />
					</div>

					<p className="text-sm font-normal text-neutral-900">Details</p>
				</div>
			</div>

			<div className="flex flex-col">
				<p className="text-sm font-medium text-neutral-700">License / Platform / Service</p>
				<h2 className="text-sm font-normal text-neutral-900 leading-snug">{row.platform}</h2>
			</div>

			{/* 3-Column Grid for Stats */}
			<div className="grid grid-cols-3 rounded-[8px] border border-neutral-400">
				<div className="flex flex-col gap-1 px-3 py-2 bg-white">
					<span className="text-xs text-neutral-700">Quantity</span>
					<span className="text-sm font-medium text-neutral-900">{row.quantity?.toLocaleString()}</span>
				</div>
				<div className="flex flex-col gap-1 px-3 py-2 bg-white border-x border-neutral-200">
					<span className="text-xs text-neutral-700">Per Unit Cost ($)</span>
					<span className="text-sm font-medium text-neutral-900">${row.per_unit_cost?.toLocaleString()}</span>
				</div>
				<div className="flex flex-col gap-1 px-3 py-2 bg-white border-l border-neutral-200">
					<span className="text-xs text-neutral-700">Total investement ($)</span>
					<span className="text-sm font-medium text-success-400">
						${row.total_investment?.toLocaleString()}
					</span>
				</div>
			</div>

			{/* Discount Callout Section */}
			{row.license_discount && (
				<div className="flex flex-col items-start gap-1 px-3 py-2 rounded-[8px] bg-[#FFF5DB]">
					<div className="px-2 py-0.5 rounded-[5px] text-xs font-medium bg-warning-200 text-warning-500 flex items-center gap-1">
						<DiscountShape size={12} color="#78350F" />
						Discount
					</div>
					<div className="flex flex-col gap-0.5">
						<p className="text-sm text-warning-500 leading-relaxed">{row.license_discount}</p>
					</div>
				</div>
			)}

			{/* Other Details */}
			<div className="flex flex-col gap-4">
				{row.duration && (
					<div className="flex flex-col">
						<h3 className="text-sm font-medium text-neutral-700">Duration</h3>
						<p className="text-sm text-neutral-900 leading-relaxed">{row.duration}</p>
					</div>
				)}

				{row.license_scope && (
					<div className="flex flex-col pb-4 border-b border-neutral-200">
						<h3 className="text-sm font-medium text-neutral-700">Scope</h3>
						<p className="text-sm text-neutral-900 leading-relaxed">{row.license_scope}</p>
					</div>
				)}

				{row.license_minimum_purchase_requirements && (
					<div className="flex flex-col">
						<h3 className="text-sm font-medium text-neutral-700">Minimum Requirements</h3>
						<p className="text-sm text-neutral-900 leading-relaxed">
							{row.license_minimum_purchase_requirements}
						</p>
					</div>
				)}

				{row.license_source_reference && (
					<div className="flex flex-col">
						<h3 className="text-sm font-medium text-neutral-700">Source Reference</h3>
						<p className="text-sm text-neutral-900 leading-relaxed">{row.license_source_reference}</p>
					</div>
				)}
			</div>
		</div>
	)
}

const InfrastructureDetails: React.FC<{ row: Record<string, any> }> = ({ row }) => {
	return (
		<div className="flex flex-col gap-4 px-4 py-3 max-h-[75vh] overflow-y-auto">
			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-2">
					<div className="flex items-center rounded-[7px] bg-neutral-900 p-1.5">
						<TableDocument size={14} color="#ffffff" />
					</div>

					<p className="text-sm font-normal text-neutral-900">Details</p>
				</div>
			</div>
			<div className="flex flex-col gap-1 rounded-[8px] bg-primary-100 p-3">
				<p className="text-sm font-medium text-primary">Infrastructure</p>
				<h2 className="text-sm font-normal text-neutral-900">{row.platform}</h2>
			</div>

			{/* 2-Column Grid for Stats */}
			<div className="grid grid-cols-2 rounded-[8px] border border-neutral-400">
				<div className="flex flex-col gap-1 px-3 py-2 bg-white">
					<span className="text-xs text-neutral-700">Monthly cost ($)</span>
					<span className="text-sm font-medium text-neutral-900">
						$
						{row.monthly_cost?.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</span>
				</div>
				<div className="flex flex-col gap-1 px-3 py-2 bg-white border-l border-neutral-200">
					<span className="text-xs text-neutral-700">Annual cost ($)</span>
					<span className="text-sm font-medium text-success-400">
						$
						{row.annual_cost?.toLocaleString("en-US", {
							minimumFractionDigits: 2,
							maximumFractionDigits: 2,
						})}
					</span>
				</div>
			</div>

			{/* Other Details */}
			<div className="flex flex-col gap-4">
				{row.requirement && (
					<div className="flex flex-col ">
						<h3 className="text-sm font-medium text-neutral-700">Requirement</h3>
						<p className="text-sm text-neutral-900 leading-relaxed">{row.requirement}</p>
					</div>
				)}

				{row.fulfillment_strategy && (
					<div className="flex flex-col ">
						<h3 className="text-sm font-medium text-neutral-700">Fulfillment Strategy</h3>
						<p className="text-sm text-neutral-900 leading-relaxed">{row.fulfillment_strategy}</p>
					</div>
				)}

				{row.notes && (
					<div className="flex flex-col ">
						<h3 className="text-sm font-medium text-neutral-700">Notes</h3>
						<p className="text-sm text-neutral-900 leading-relaxed">{row.notes}</p>
					</div>
				)}
			</div>
		</div>
	)
}

interface DataTableSectionProps {
	columns: Array<{ key: string; label: string; editable?: boolean }>
	rows: Array<Record<string, any>>
	tabId: string
	editable?: boolean
}

const DataTableSection: React.FC<DataTableSectionProps> = ({ columns, rows, tabId, editable }) => {
	const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(0)
	const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
	const [editValue, setEditValue] = useState<any>("")
	const [hoveredRowIdx, setHoveredRowIdx] = useState<number | null>(null)

	const { updateRowData, deleteRow } = useCostingStore()

	const processedRows = useMemo(() => {
		return rows.map((row) => {
			let cost = row.cost,
				annual_cost = row.annual_cost,
				total_investment = row.total_investment
			if (tabId === "human-resources") cost = (Number(row.hours) || 0) * (Number(row.rate) || 0)
			else if (tabId === "infrastructure") annual_cost = (Number(row.monthly_cost) || 0) * 12
			else if (tabId === "licenses")
				total_investment = (Number(row.quantity) || 0) * (Number(row.per_unit_cost) || 0)
			return { ...row, cost, annual_cost, total_investment }
		})
	}, [rows, tabId])

	const selectedRow = selectedRowIdx !== null ? processedRows[selectedRowIdx] : null

	const handleCellClick = (rowIdx: number, colKey: string) => {
		if (editable && columns.find((c) => c.key === colKey)?.editable) {
			setEditingCell({ row: rowIdx, col: colKey })
			setEditValue(rows[rowIdx][colKey] ?? "")
			setSelectedRowIdx(rowIdx)
		}
	}

	const handleSave = () => {
		if (!editingCell) return
		const { row, col } = editingCell
		updateRowData(tabId, row, { ...rows[row], [col]: editValue })
		setEditingCell(null)
	}

	const handleCancel = () => {
		setEditingCell(null)
		setEditValue("")
	}

	const handleDeleteRow = (e: React.MouseEvent, rowIdx: number) => {
		e.stopPropagation() // Prevent row selection
		deleteRow(tabId, rowIdx)

		// Adjust selected row index if needed
		if (selectedRowIdx === rowIdx) {
			setSelectedRowIdx(processedRows.length > 1 ? Math.max(0, rowIdx - 1) : null)
		} else if (selectedRowIdx !== null && selectedRowIdx > rowIdx) {
			setSelectedRowIdx(selectedRowIdx - 1)
		}
	}

	return (
		<div className="flex w-full gap-4">
			<div className="flex-1 flex flex-col gap-3">
				<SummaryBar tabId={tabId} rows={processedRows} />
				<div
					className="rounded-lg border border-solid border-neutral-400 bg-white custom-scrollbar overflow-y-auto"
					style={{ maxHeight: "calc(100vh - 300px)" }}
				>
					<Table>
						<TableHeader>
							<TableRow>
								{columns.map((col) => (
									<TableHead
										key={col.key}
										className="px-4 py-3 font-medium text-gray-600 bg-gray-50 border-b border-neutral-400 [&:not(:last-child)]:border-r"
									>
										{col.label}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{processedRows.length > 0 ? (
								processedRows.map((row, rowIdx) => {
									const isRowSelected = selectedRowIdx === rowIdx
									const isRowHovered = hoveredRowIdx === rowIdx
									return (
										<TableRow
											key={rowIdx}
											className={`cursor-pointer transition-colors ${
												isRowSelected ? "bg-neutral-200" : "hover:bg-gray-50"
											}`}
											onClick={() => setSelectedRowIdx(rowIdx)}
											onMouseEnter={() => setHoveredRowIdx(rowIdx)}
											onMouseLeave={() => setHoveredRowIdx(null)}
										>
											{columns.map((col, colIdx) => {
												const isEditing =
													editingCell?.row === rowIdx && editingCell?.col === col.key
												const isCurrency = [
													"rate",
													"cost",
													"monthly_cost",
													"annual_cost",
													"total_investment",
												].includes(col.key)
												const value = row[col.key]

												let textColor = "text-neutral-700"
												if (colIdx === 1) {
													textColor = "text-neutral-900 font-medium"
												} else if (colIdx === columns.length - 1) {
													textColor = "text-success-400 font-medium"
												}

												return (
													<TableCell
														key={col.key}
														className="px-4 py-3 border-b border-neutral-400 [&:not(:last-child)]:border-r"
														onClick={() => handleCellClick(rowIdx, col.key)}
													>
														{isEditing ? (
															<EditableCell
																value={editValue}
																onChange={setEditValue}
																onSave={handleSave}
																onCancel={handleCancel}
															/>
														) : (
															<div
																className={`flex items-center justify-between ${textColor}`}
															>
																<span className="truncate">
																	{isCurrency && "$"}
																	{isCurrency && typeof value === "number"
																		? value.toLocaleString()
																		: truncateText(value, 30)}
																</span>
																{colIdx === columns.length - 1 && (
																	<div className="flex items-center gap-1">
																		<button
																			onClick={(e) => handleDeleteRow(e, rowIdx)}
																			className={`p-1 cursor-pointer rounded hover:bg-danger-200/30 transition-colors ${
																				isRowHovered
																					? "opacity-100"
																					: "opacity-0"
																			}`}
																			title="Delete row"
																		>
																			<Trash2
																				size={14}
																				className="text-danger-300 "
																			/>
																		</button>
																		<ArrowRight2
																			variant="Bold"
																			size={16}
																			className={
																				isRowSelected
																					? "text-neutral-900"
																					: "text-neutral-400"
																			}
																		/>
																	</div>
																)}
															</div>
														)}
													</TableCell>
												)
											})}
										</TableRow>
									)
								})
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="h-24 text-center">
										No data available.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
			<DetailsView selectedRow={selectedRow} tabId={tabId} />
		</div>
	)
}

export default DataTableSection
