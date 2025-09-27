import React from "react";

const randomColor = () =>
    `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;

const randomCircle = (i: number) => {
    const size = 40 + Math.random() * 60;
    const x = Math.random() * 400;
    const y = Math.random() * 300;
    return (
        <circle
            key={i}
            cx={x}
            cy={y}
            r={size / 2}
            fill={randomColor()}
            opacity={0.6}
        />
    );
};

export default function TestPage() {
    return (
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
            <h1 style={{ fontFamily: "sans-serif", color: "#333" }}>Random Test Page</h1>
            <svg width={500} height={350} style={{ border: "2px solid #eee", borderRadius: 12, background: "#fafafa" }}>
                {[...Array(7)].map((_, i) => randomCircle(i))}
                <rect
                    x={100}
                    y={100}
                    width={120}
                    height={80}
                    fill={randomColor()}
                    opacity={0.4}
                    rx={18}
                />
                <text x={250} y={320} textAnchor="middle" fontSize={22} fill="#555">
                    Graphics Demo
                </text>
            </svg>
        </main>
    );
}