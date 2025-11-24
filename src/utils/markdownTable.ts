/**
 * Utility functions for parsing and generating markdown tables
 */

export type Alignment = "left" | "center" | "right"

export interface TableData {
	headers: string[]
	rows: string[][]
	alignments: Alignment[]
}

/**
 * Check if a string contains a markdown table
 */
export function isMarkdownTable(text: string): boolean {
	if (!text || typeof text !== "string") return false

	const lines = text.trim().split("\n")
	if (lines.length < 2) return false

	// Check if first line has pipes
	const firstLine = lines[0].trim()
	if (!firstLine.includes("|")) return false

	// Count pipes in first line (should have at least 2 for a valid table)
	const pipeCount = (firstLine.match(/\|/g) || []).length
	if (pipeCount < 1) return false

	// Check if second line is a separator row (contains dashes and pipes)
	const secondLine = lines[1].trim()

	// More flexible separator pattern that handles various formats
	// Allows for optional spaces, optional colons for alignment
	const separatorPattern = /^[\s|:-]+$/
	if (!separatorPattern.test(secondLine)) return false

	// Additional check: separator should have dashes
	if (!secondLine.includes("-")) return false

	return true
}

/**
 * Parse a markdown table string into structured data
 */
export function parseMarkdownTable(markdown: string): TableData | null {
	const lines = markdown
		.trim()
		.split("\n")
		.filter((line) => line.trim())

	if (lines.length < 2) return null

	// Parse header row
	const headerLine = lines[0]
	const headers = headerLine
		.split("|")
		.map((cell) => cell.trim())
		.filter((cell) => cell !== "")

	// Parse alignment row
	const alignmentLine = lines[1]
	const alignments: Alignment[] = alignmentLine
		.split("|")
		.map((cell) => cell.trim())
		.filter((cell) => cell !== "")
		.map((cell) => {
			if (cell.startsWith(":") && cell.endsWith(":")) return "center"
			if (cell.endsWith(":")) return "right"
			return "left"
		})

	// Parse data rows
	const rows: string[][] = []
	for (let i = 2; i < lines.length; i++) {
		const row = lines[i]
			.split("|")
			.map((cell) => cell.trim())
			.filter((_, index, arr) => {
				// Keep cells that are not the first or last if they're empty
				// (those are just the outer pipes)
				if (index === 0 && arr[0] === "") return false
				if (index === arr.length - 1 && arr[arr.length - 1] === "") return false
				return true
			})

		if (row.length > 0) {
			// Ensure row has same number of columns as headers
			while (row.length < headers.length) {
				row.push("")
			}
			rows.push(row.slice(0, headers.length))
		}
	}

	return { headers, rows, alignments }
}

/**
 * Generate a markdown table string from structured data
 */
export function generateMarkdownTable(data: TableData): string {
	const { headers, rows, alignments } = data

	if (headers.length === 0) return ""

	// Calculate column widths for better formatting
	const columnWidths = headers.map((header, i) => {
		const headerWidth = header.length
		const maxRowWidth = rows.reduce((max, row) => {
			return Math.max(max, (row[i] || "").length)
		}, 0)
		return Math.max(headerWidth, maxRowWidth, 3) // Minimum width of 3
	})

	// Helper function to pad cell content
	const padCell = (content: string, width: number, align: Alignment): string => {
		const padding = width - content.length
		if (padding <= 0) return content

		switch (align) {
			case "center":
				const leftPad = Math.floor(padding / 2)
				const rightPad = padding - leftPad
				return " ".repeat(leftPad) + content + " ".repeat(rightPad)
			case "right":
				return " ".repeat(padding) + content
			default:
				return content + " ".repeat(padding)
		}
	}

	// Generate header row
	const headerRow =
		"| " + headers.map((header, i) => padCell(header, columnWidths[i], alignments[i] || "left")).join(" | ") + " |"

	// Generate alignment row
	const alignmentRow =
		"| " +
		alignments
			.map((align, i) => {
				const width = columnWidths[i]
				const dashes = "-".repeat(width)
				switch (align) {
					case "center":
						return ":" + dashes.slice(2) + ":"
					case "right":
						return dashes.slice(1) + ":"
					default:
						return dashes
				}
			})
			.join(" | ") +
		" |"

	// Generate data rows
	const dataRows = rows.map(
		(row) => "| " + row.map((cell, i) => padCell(cell, columnWidths[i], alignments[i] || "left")).join(" | ") + " |"
	)

	return [headerRow, alignmentRow, ...dataRows].join("\n")
}

/**
 * Add a new row to the table data
 */
export function addRow(data: TableData, index?: number): TableData {
	const newRow = new Array(data.headers.length).fill("")
	const newRows = [...data.rows]

	if (index !== undefined && index >= 0 && index <= newRows.length) {
		newRows.splice(index, 0, newRow)
	} else {
		newRows.push(newRow)
	}

	return { ...data, rows: newRows }
}

/**
 * Remove a row from the table data
 */
export function removeRow(data: TableData, index: number): TableData {
	if (index < 0 || index >= data.rows.length) return data

	const newRows = [...data.rows]
	newRows.splice(index, 1)

	return { ...data, rows: newRows }
}

/**
 * Add a new column to the table data
 */
export function addColumn(data: TableData, index?: number): TableData {
	const { headers, rows, alignments } = data
	const newHeaders = [...headers]
	const newAlignments = [...alignments]
	const colIndex = index !== undefined && index >= 0 && index <= headers.length ? index : headers.length

	newHeaders.splice(colIndex, 0, "New Column")
	newAlignments.splice(colIndex, 0, "left")

	const newRows = rows.map((row) => {
		const newRow = [...row]
		newRow.splice(colIndex, 0, "")
		return newRow
	})

	return {
		headers: newHeaders,
		rows: newRows,
		alignments: newAlignments,
	}
}

/**
 * Remove a column from the table data
 */
export function removeColumn(data: TableData, index: number): TableData {
	if (index < 0 || index >= data.headers.length) return data
	if (data.headers.length <= 1) return data // Don't remove the last column

	const newHeaders = [...data.headers]
	newHeaders.splice(index, 1)

	const newAlignments = [...data.alignments]
	newAlignments.splice(index, 1)

	const newRows = data.rows.map((row) => {
		const newRow = [...row]
		newRow.splice(index, 1)
		return newRow
	})

	return {
		headers: newHeaders,
		rows: newRows,
		alignments: newAlignments,
	}
}

/**
 * Update a cell in the table data
 */
export function updateCell(
	data: TableData,
	rowIndex: number,
	colIndex: number,
	value: string,
	isHeader: boolean = false
): TableData {
	if (isHeader) {
		if (colIndex < 0 || colIndex >= data.headers.length) return data
		const newHeaders = [...data.headers]
		newHeaders[colIndex] = value
		return { ...data, headers: newHeaders }
	} else {
		if (rowIndex < 0 || rowIndex >= data.rows.length) return data
		if (colIndex < 0 || colIndex >= data.headers.length) return data

		const newRows = [...data.rows]
		newRows[rowIndex] = [...newRows[rowIndex]]
		newRows[rowIndex][colIndex] = value
		return { ...data, rows: newRows }
	}
}

/**
 * Update column alignment
 */
export function updateAlignment(data: TableData, colIndex: number, alignment: Alignment): TableData {
	if (colIndex < 0 || colIndex >= data.alignments.length) return data

	const newAlignments = [...data.alignments]
	newAlignments[colIndex] = alignment

	return { ...data, alignments: newAlignments }
}
