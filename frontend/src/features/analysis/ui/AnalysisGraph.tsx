import React, { useEffect, useState } from 'react';
import { Bar, Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import styles from './AnalysisGraph.module.scss';
import BoardLayout from 'shared/components/BoardLayout';
import { sendGetItems } from '../api/analysisApi';

// Chart.js 플러그인 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

export const AnalysisGraph: React.FC = () => {
  const [data, setData] = useState<any>(null); // 데이터를 저장할 상태
  const [loading, setLoading] = useState<boolean>(true); // 로딩 상태 관리

  useEffect(() => {
    // 데이터를 가져오는 비동기 함수
    const fetchData = async () => {
      try {
        const result = await sendGetItems();
        setData(result); // 가져온 데이터를 상태에 저장
        console.log(data);
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false); // 로딩 종료
      }
    };

    fetchData(); // 컴포넌트가 렌더링될 때 데이터 가져오기
  }, []);

  // Bar Chart Data
  const barChartData = {
    labels: ['Label 1', 'Label 2', 'Label 3', 'Label 4'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [10, 20, 30, 40],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Bar Chart Example',
      },
    },
  };

  // Confusion Matrix Data
  const confusionMatrixData = {
    labels: ['Predicted A', 'Predicted B'], // X축 라벨
    datasets: [
      {
        label: 'Actual A',
        data: [50, 5],
        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Actual B',
        data: [10, 35],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const confusionMatrixOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Predicted Classes',
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Actual Classes',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Count: ${context.raw}`,
        },
      },
      datalabels: {
        display: true,
        color: 'black',
        formatter: (value: number) => value,
      },
    },
  };

  return (
    <BoardLayout>
      <div className={styles.container}>
        {/* 그래프 섹션 */}
        <div className={styles.graphSection}>
          <h2>Graph Visualization</h2>
          <div className={styles.graph}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>

        {/* 혼동행렬 섹션 */}
        <div className={styles.matrixSection}>
          <h2>Confusion Matrix</h2>
          <div className={styles.graph}>
            <Bar data={confusionMatrixData} options={confusionMatrixOptions} />
          </div>
        </div>
      </div>
    </BoardLayout>
  );
};
