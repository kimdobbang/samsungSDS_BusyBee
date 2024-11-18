import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import styles from './AnalysisGraph.module.scss';
import BoardLayout from 'shared/components/BoardLayout';
import { sendGetItems } from '../api/analysisApi';

// Chart.js 플러그인 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalysisGraph: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [accuracies, setAccuracies] = useState<number[]>([]);
  const [matrixData, setMatrixData] = useState<number[][]>([]);
  const [classLabels, setClassLabels] = useState<string[]>([
    '스　　팸',
    '주　　문',
    '견　　적',
    '기　　타',
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await sendGetItems();
        console.log(result);

        // 데이터 정렬: timestamp 기준으로 오름차순 정렬
        const sortedResults = result.results.sort(
          (a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // 정렬된 데이터를 기반으로 timestamps와 accuracies 설정
        const newTimestamps = sortedResults.map((item: any) => {
          const date = new Date(item.timestamp);
          // 월, 일만 반환
          const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1
          const day = date.getDate();
          return `${month}월 ${day}일`;
        });

        const newAccuracies = result.results.map((item: any) =>
          parseFloat(item.accuracy)
        );

        setTimestamps(newTimestamps);
        setAccuracies(newAccuracies);

        console.log(timestamps);

        const matrix = result.results.map((item: any) =>
          JSON.parse(item.confusion_matrix)
        );
        if (matrix.length > 0) {
          setMatrixData(matrix[matrix.length - 1]);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Line Chart Data
  const lineChartData = {
    labels: timestamps, // X축 레이블
    datasets: [
      {
        label: 'Accuracy',
        data: accuracies,
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // 라인 아래 영역 색상
        borderColor: 'rgba(75, 192, 192, 1)', // 라인 색상
        pointBackgroundColor: 'rgba(75, 192, 192, 1)', // 포인트 색상
        borderWidth: 2, // 라인 두께
        fill: true, // 라인 아래 영역 채우기
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Accuracy Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Timestamp',
        },
        ticks: {
          callback: (value: number | string, index: number, ticks: any) => {
            const timestamp = timestamps[Number(value)];
            return timestamp ? timestamp.split('\n') : '';
          },
        },
      },
      y: {
        title: {
          display: true,
          text: 'Accuracy',
        },
        beginAtZero: true,
        max: 1,
      },
    },
  };
  return (
    <BoardLayout>
      <div className={styles.container}>
        {/* 그래프 섹션 */}
        <div className={styles.graphSection}>
          <h2>Accuracy Over Time</h2>
          <div className={styles.graph}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* 혼동행렬 섹션 */}
        <div className={styles.matrixSection}>
          <h2>Confusion Matrix</h2>
          <br />
          <div className={styles.matrixContainer}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th></th>
                  {classLabels.map((label, idx) => (
                    <th key={`header-${idx}`} className={styles.headerCell}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixData.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    <th className={styles.headerCell}>
                      {classLabels[rowIndex]}
                    </th>
                    {row.map((value, colIndex) => (
                      <td
                        key={`cell-${rowIndex}-${colIndex}`}
                        className={`${styles.cell} ${
                          rowIndex === colIndex ? styles.diagonal : ''
                        }`}
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BoardLayout>
  );
};
