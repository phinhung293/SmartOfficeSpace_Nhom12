import React from "react";

/**
 * SummaryCard — thẻ thống kê tổng quan.
 *
 * Props:
 *   label   {string}
 *   value   {string|number}
 *   icon    {string}   emoji hoặc ký tự
 *   color   {string}   "blue" | "green" | "orange" | "purple" | "red"
 */
export default function SummaryCard({ label, value, icon, color = "blue" }) {
    return (
        <div className="summary-card">
            <div className={`summary-card-icon ${color}`}>{icon}</div>
            <div className="summary-card-body">
                <div className="summary-card-label">{label}</div>
                <div className={`summary-card-value ${color}`}>{value}</div>
            </div>
        </div>
    );
}