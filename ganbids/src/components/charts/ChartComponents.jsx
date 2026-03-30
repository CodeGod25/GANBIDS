import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    filler: { propagate: true },
    legend: { display: false },
    tooltip: {
      backgroundColor: '#22262F',
      titleFont: { family: "'JetBrains Mono', monospace", size: 10 },
      bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
      borderColor: 'rgba(105, 218, 255, 0.2)',
      borderWidth: 1,
      padding: 8,
      displayColors: true,
      caretPadding: 10,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 9 }, color: '#73757d' },
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.03)', drawBorder: false },
      ticks: { font: { family: "'JetBrains Mono', monospace", size: 9 }, color: '#73757d' },
    },
  },
}

export function LossChart({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'G-LOSS',
        data: data.generatorLoss,
        borderColor: '#2FF801',
        backgroundColor: 'rgba(47, 248, 1, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'D-LOSS',
        data: data.discriminatorLoss,
        borderColor: '#FF7073',
        backgroundColor: 'rgba(255, 112, 115, 0.05)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: true,
      },
    ],
  }
  return <Line data={chartData} options={chartOptions} />
}

export function ThreatTimelineChart({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'IDS Accuracy',
        data: data.idsAccuracy,
        borderColor: '#69DAFF',
        backgroundColor: 'rgba(105, 218, 255, 0.05)',
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#69DAFF',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'GAN Evasion Rate',
        data: data.ganEvasion,
        borderColor: '#FF716C',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 0,
        tension: 0.4,
      },
    ],
  }
  return <Line data={chartData} options={chartOptions} />
}

export function ConfidenceChart({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Count',
        data: data.values,
        backgroundColor: [
          'rgba(255, 112, 115, 0.8)',
          'rgba(255, 181, 71, 0.8)',
          'rgba(105, 218, 255, 0.8)',
          'rgba(105, 218, 255, 0.7)',
          'rgba(47, 248, 1, 0.8)',
          'rgba(47, 248, 1, 0.7)',
          'rgba(0, 207, 252, 0.8)',
          'rgba(0, 207, 252, 0.9)',
        ],
        borderRadius: 0,
        barThickness: 'flex',
      },
    ],
  }
  return <Bar data={chartData} options={chartOptions} />
}

export function ProtocolChart({ protocols }) {
  return (
    <div className="protocol-distribution">
      {protocols.map(p => (
        <div key={p.name} className="protocol-item">
          <div className="protocol-header">
            <span className="protocol-name">{p.name}</span>
            <span className="protocol-pct">{p.percentage}%</span>
          </div>
          <div className="protocol-bar">
            <div className="protocol-fill" style={{ width: `${p.percentage}%`, backgroundColor: p.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default { LossChart, ThreatTimelineChart, ConfidenceChart, ProtocolChart }
