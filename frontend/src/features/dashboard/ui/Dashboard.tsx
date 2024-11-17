import React, { useEffect, useState } from 'react';
import { ReactComponent as MailCheckIcon } from 'shared/assets/icons/mail-check.svg';
import { ReactComponent as CalendarIcon } from 'shared/assets/icons/calendar.svg';
// import busybee3 from 'shared/assets/images/busybee2.png';
import BoardLayout from 'shared/components/BoardLayout';
import styles from './DashBoard.module.scss';

import { Map, MultiStepProgress, CameraViewer } from 'features';
import { sendToLambda, useAuth } from '../..';
import { CountByDate } from '../../../shared/utils/getCountByDate';
// import { CountInProgressQuotes } from 'features/mail/utils/estimate';
import { getTodayOrderMail } from 'features/mail/utils/estimate';
import { getMonthOrderMail } from 'features/mail/utils/estimate';
import { RowData } from '../model/boardmodel';
import { sortByReceivedDate } from 'features/mail/utils/sort';
// import { sendDataToLambda } from '../api/dashboardApi';
import { SendMailModal } from '../ui/SendMailModal';
import { SensorData, GpsData } from 'features/dashboard/model/boardmodel';
import { getCityNameByCode, getCoordinatesByCode } from 'shared/utils/getLatLng';

export const Dashboard = () => {
  const [, authEmail] = useAuth() || [];
  const email = typeof authEmail === 'string' ? authEmail : '';
  const [countToday, setTodayCount] = useState(0);
  const [countMonthly, setMonthlyCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [todayRows, setTodayRows] = useState<RowData[]>([]);
  const [originalRows, setOriginalRows] = useState<RowData[]>([]);
  const [monthRows, setMonthRows] = useState<RowData[]>([]);
  const [paginatedRows, setPaginatedRows] = useState<RowData[]>([]);
  const [detailEstimateView, setDetailEstimateView] = useState<RowData | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);

  const itemsPerPage = 10;
  const [showAll, setShowAll] = useState(false);
  const [selectIndex, setSelectIndex] = useState<number | null>(null);
  const [selectIndexCopy, setSelectIndexCopy] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [showSendMailModal, setShowSendMailModal] = useState<boolean>(false);

  // sensorData 상태를 SensorData 클래스를 사용해 초기화
  const [isConnected, setIsConnected] = useState(false);

  const [sensorData, setSensorData] = useState<SensorData>(new SensorData());
  const [gpsData, setGpsData] = useState<GpsData>(new GpsData());
  // WebSocket 설정 및 연결
  useEffect(() => {
    const ws = new WebSocket('wss://mqsocket.busybeemail.net');

    ws.onopen = () => {
      console.log('WebSocket 서버에 연결되었습니다.');
      setIsConnected(true); // 연결 성공 시 상태 업데이트
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 데이터 파싱 및 상태 업데이트
        if (data.topic === 'sensor/data') {
          const sensor = new SensorData(data.data); // 새로운 SensorData 생성
          console.log('sensor: ', sensor);
          setSensorData(sensor);
        } else if (data.topic === 'gps/data') {
          const gps = new GpsData(data.data); // 새로운 GpsData 생성
          console.log('gps: ', gps);
          setGpsData(gps);
        }
      } catch (error) {
        console.error('메시지 처리 중 에러:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket 연결이 종료되었습니다.');
      setIsConnected(false);
    };

    // 컴포넌트가 언마운트될 때 WebSocket 닫기
    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!isConnected) {
      // WebSocket 연결이 실패했을 경우 기본값 설정
      setSensorData(new SensorData({ temperature: 0, humidity: 0, isOpen: false, status: 0 }));
      setGpsData(new GpsData({ lat: 0, lon: 0 }));
    }
  }, [isConnected]);

  useEffect(() => {
    const fetchLambdaData = async () => {
      try {
        const res = await sendToLambda(email);

        const sortRes = sortByReceivedDate(res);
        const { todayCount, monthCount } = CountByDate(sortRes);
        setTodayCount(todayCount);
        setMonthlyCount(monthCount);
        setOrderCount(sortRes.length);

        const TodayOrderMail = getTodayOrderMail(sortRes);
        const MonthOrderMail = getMonthOrderMail(sortRes);
        console.log(sortRes);

        setOriginalRows(sortRes);
        setTodayRows(TodayOrderMail);
        setMonthRows(MonthOrderMail);
      } catch (error) {
        console.error('Error fetching data from Lambda:', error);
      }
    };
    fetchLambdaData();
  }, [email, itemsPerPage]);

  useEffect(() => {
    setPaginatedRows(originalRows);
  }, [originalRows]);

  useEffect(() => {}, [selectIndex]);

  useEffect(() => {
    if (detailEstimateView?.data?.S) {
      setDetailData(JSON.parse(detailEstimateView.data.S));
      console.log('DETAIL DATA: ', detailData);
    }
  }, [detailEstimateView]);

  const selectedStyle = {
    backgroundColor: 'var(--sub01)', // 하늘색 배경
  };

  const getTemperatureBgColor = (temperature: number) => {
    if (temperature <= 10) {
      return '#4f83cc'; // 매우 낮은 온도 - 진한 파란색
    } else if (temperature <= 15) {
      return '#6699ff'; // 조금 낮은 온도 - 파란색
    } else if (temperature <= 20) {
      return '#85b8ff'; // 시원한 파란색
    } else if (temperature <= 25) {
      return '#a3d4ff'; // 부드러운 밝은 파란색
    } else if (temperature <= 30) {
      return '#cce7ff'; // 연한 하늘색
    } else if (temperature <= 35) {
      return '#ffdb99'; // 약간 따뜻한 노란색
    } else if (temperature <= 37) {
      return '#ffcc66'; // 더 따뜻한 노란색
    } else if (temperature <= 40) {
      return '#ffb347'; // 진한 주황색 (높은 온도)
    } else {
      return '#ff8c69'; // 매우 높은 온도 - 붉은 주황색
    }
  };

  // 습도에 따른 배경 색상 결정
  const getHumidityBgColor = (humidity: number) => {
    if (humidity <= 20) {
      return '#cdeffb'; // 연한 파란색 (낮은 습도)
    } else if (humidity <= 40) {
      return '#a7e0f9'; // 조금 더 진한 파란색
    } else if (humidity <= 60) {
      return '#6bcef5'; // 기본 파란색 (중간 습도, primary color)
    } else if (humidity <= 80) {
      return '#369dfc'; // 더 진한 파란색
    } else {
      return '#1177ff'; // 아주 진한 파란색 (높은 습도, hover color)
    }
  };

  const handleTodayMailClick = () => {
    setPaginatedRows(todayRows);
    setVisibleCount(3);
    setShowAll(false);
    setSelectIndex(null);
    setDetailEstimateView(null);
    console.log(paginatedRows);
  };

  const handleMonthMailClick = () => {
    setPaginatedRows(monthRows);
    setVisibleCount(3);
    setShowAll(false);
    setSelectIndex(null);
    setDetailEstimateView(null);
  };

  const handleShowMore = () => {
    const newVisibleCount = visibleCount + itemsPerPage;
    setVisibleCount(newVisibleCount);

    if (newVisibleCount >= paginatedRows.length) {
      setShowAll(true);
    }
  };

  const handleClose = () => {
    setPaginatedRows(paginatedRows);
    setVisibleCount(3);
    setShowAll(false);
  };

  const detailEstimate = () => {
    if (selectIndexCopy !== null) {
      setSelectIndex(selectIndexCopy);
      const selectedEstimate = paginatedRows[selectIndexCopy];
      setDetailEstimateView(selectedEstimate);
      console.log(originalRows[selectIndexCopy].sender.S);
    }
  };
  const sendMail = () => {
    setShowSendMailModal(true);
    if (selectIndex !== null) {
      // const sender = originalRows[selectIndex].receiver?.S;
      // const receiver = originalRows[selectIndex].sender.S;
      // const match = receiver.match(/<(.*?)>/);
      // const REreceiver = receiver && match ? match[1] : null;
      // const text = '잘부탁드랴여 ㅎㅎ';
      // if (REreceiver !== null && sender !== undefined) {
      // const res = sendDataToLambda(REreceiver, sender, text);
      //   console.log(REreceiver);
      //   console.log(sender);
      //   console.log(res);
      // }
    }
  };

  return (
    <BoardLayout>
      <div className={`${styles.dashboard} ${detailEstimateView ? styles.withDetail : ''}`}>
        {/* 상단 섹션 */}
        <div className={styles.top}>
          <div className={styles.statisticbox}>
            <div className={styles.statistics}>
              <h2>오늘 견적 요청 메일</h2>
              <h3>{countToday}건</h3>
            </div>
            <div className={styles.buttondiv}>
              <button onClick={handleTodayMailClick} className={styles.iconbutton}>
                <MailCheckIcon width={28} height={28} />
              </button>
            </div>
          </div>
          <div className={styles.statisticbox}>
            <div className={styles.statistics}>
              <h2>월간 요청 메일</h2>
              <h3>{countMonthly}건</h3>
            </div>
            <button onClick={handleMonthMailClick} className={styles.iconbutton}>
              <CalendarIcon width={32} height={32} />
            </button>
          </div>
        </div>

        {/* 중앙 섹션 */}
        <div className={styles.middle}>
          <div className={styles.quotebox}>
            <div className={styles.middleHeader}>
              <div>
                <h1>진행중인 견적</h1>
                <h2>{orderCount}건 발급 진행중</h2>
              </div>
              <button onClick={detailEstimate} className={styles.textbutton}>
                조회하기
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>견적요청처</th>
                  <th>요청날짜</th>
                  <th>단계</th>
                  <th>완료여부</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.slice(0, visibleCount).map((row: RowData, index) => (
                  <tr
                    key={index}
                    className={styles.line}
                    style={selectIndexCopy === index ? selectedStyle : {}} // selectIndex를 사용
                    onClick={() => setSelectIndexCopy(index)} // selectIndex를 설정
                  >
                    <td>{row.sender.S}</td>
                    <td>{row.received_date.S}</td>
                    <td>
                      <div className={styles.stage}>
                        <p>
                          {selectIndex === index ? sensorData.status * 20 : row.status.N * 20} %
                        </p>
                        <div className={styles.progressBarContainer}>
                          <div
                            className={styles.progressBar}
                            style={{
                              width: `${
                                selectIndex === index ? sensorData.status * 20 : row.status.N * 20
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {selectIndex === index
                        ? sensorData.status === 5
                          ? '완료'
                          : '진행중'
                        : row.status.N === 5
                        ? '완료'
                        : '진행중'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {showAll ? (
              <button onClick={handleClose} className={styles.moreButton}>
                닫기
              </button>
            ) : (
              <button onClick={handleShowMore} className={styles.moreButton}>
                더보기
              </button>
            )}
          </div>
        </div>

        {/* 하단 섹션 (견적 요청이 선택된 경우에만 표시) */}
        {detailEstimateView && (
          <div className={styles.bottom}>
            <div className={styles.detailquote}>
              <div>
                <h1>
                  {selectIndex !== null ? originalRows[selectIndex].sender.S : 0}
                  님의 견적 요청 자세히보기
                </h1>
                <button onClick={sendMail} className={styles.textbutton}>
                  메일보내기
                </button>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>무게</th>
                    <th>컨테이너 사이즈</th>
                    <th>출발 날짜</th>
                    <th>도착 날짜</th>
                    <th>출발 도시</th>
                    <th>도착 도시</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className={
                        detailData?.Weight && detailData.Weight !== 'unknown'
                          ? ''
                          : styles.missingData
                      }
                    >
                      {detailData?.Weight && detailData.Weight !== 'unknown'
                        ? detailData.Weight
                        : '미기입'}
                    </td>
                    <td
                      className={
                        detailData?.ContainerSize && detailData.ContainerSize !== 'unknown'
                          ? ''
                          : styles.missingData
                      }
                    >
                      {detailData?.ContainerSize && detailData.ContainerSize !== 'unknown'
                        ? detailData.ContainerSize
                        : '미기입'}
                    </td>
                    <td
                      className={
                        detailData?.DepartureDate && detailData.DepartureDate !== 'unknown'
                          ? ''
                          : styles.missingData
                      }
                    >
                      {detailData?.DepartureDate && detailData.DepartureDate !== 'unknown'
                        ? detailData.DepartureDate
                        : '미기입'}
                    </td>
                    <td
                      className={
                        detailData?.ArrivalDate && detailData.ArrivalDate !== 'unknown'
                          ? ''
                          : styles.missingData
                      }
                    >
                      {detailData?.ArrivalDate && detailData.ArrivalDate !== 'unknown'
                        ? detailData.ArrivalDate
                        : '미기입'}
                    </td>
                    <td
                      className={
                        detailData?.DepartureCity && detailData.DepartureCity !== 'unknown'
                          ? ''
                          : styles.missingData
                      }
                    >
                      {detailData?.DepartureCity && detailData.DepartureCity !== 'unknown'
                        ? detailData.DepartureCity
                        : '미기입'}
                    </td>
                    <td
                      className={
                        detailData?.ArrivalCity && detailData.ArrivalCity !== 'unknown'
                          ? ''
                          : styles.missingData
                      }
                    >
                      {detailData?.ArrivalCity && detailData.ArrivalCity !== 'unknown'
                        ? detailData.ArrivalCity
                        : '미기입'}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className={styles.barSection}>
                <MultiStepProgress status={selectIndex !== null ? sensorData.status : 0} />
              </div>
              <div className={styles.detail}>
                <div className={styles.detailTop}>
                  <div className={styles.topHalf}>
                    <h1>현재 위치</h1>
                  </div>
                  <div className={styles.topHalf}>
                    <h1>카메라</h1>
                  </div>
                </div>
                <div className={styles.detailBottom}>
                  <div className={styles.bottomTop}>
                    <div className={styles.map}>
                      <Map
                        startLat={getCoordinatesByCode(detailData?.DepartureCity)?.lat || 0} // 기본값 0 사용
                        startLng={getCoordinatesByCode(detailData?.DepartureCity)?.lng || 0}
                        endLat={getCoordinatesByCode(detailData?.ArrivalCity)?.lat || 0}
                        endLng={getCoordinatesByCode(detailData?.ArrivalCity)?.lng || 0}
                        currentLat={gpsData?.lat || 0}
                        currentLng={gpsData?.lon || 0}
                      />
                    </div>
                    <div className={styles.bottomRight}>
                      <div className={styles.camera}>
                        <div>
                          <CameraViewer />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.sensor}>
                    <div className={styles.col}>
                      <h2>현재 위도</h2>
                      <div className={styles.square}>{gpsData.lat}</div>
                    </div>
                    <div className={styles.col}>
                      <h2>현재 경도</h2>
                      <div className={styles.square}>{gpsData.lon}</div>
                    </div>
                    <div className={styles.col}>
                      <h2>열림 감지</h2>
                      <div
                        className={styles.square}
                        style={{
                          backgroundColor: sensorData.isOpen ? '#a3e6ff' : '#3a8bb2',
                          color: 'white', // 텍스트 색상 (흰색)으로 설정
                        }}
                      >
                        {sensorData.isOpen ? 'OPEN' : 'CLOSED'}
                      </div>
                    </div>
                    <div className={styles.col}>
                      <h2>내부 온도</h2>
                      <div
                        className={styles.square}
                        style={{ backgroundColor: getTemperatureBgColor(sensorData.temperature) }}
                      >
                        {sensorData.temperature}°C
                      </div>
                    </div>
                    <div className={styles.col}>
                      <h2>내부 습도</h2>
                      <div
                        className={styles.square}
                        style={{ backgroundColor: getHumidityBgColor(sensorData.temperature) }}
                      >
                        {sensorData.humidity}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {showSendMailModal && selectIndex !== null && (
        <SendMailModal
          showModal={true}
          onClose={() => {
            setShowSendMailModal(false);
          }}
          onSend={() => {
            setShowSendMailModal(false);
            setShowSendMailModal(false);
          }}
          orderId={originalRows[selectIndex].Id?.S || ''}
          sender={originalRows[selectIndex].receiver?.S || ''}
          REreceiver={originalRows[selectIndex].sender.S?.match(/<(.+?)>/)?.[1] || ''}
          Weight={
            detailData?.Weight && detailData.Weight !== 'unknown' ? detailData.Weight : '미기입'
          }
          ContainerSize={
            detailData?.ContainerSize && detailData.ContainerSize !== 'unknown'
              ? detailData.ContainerSize
              : '미기입'
          }
          DepartureDate={
            detailData?.DepartureDate && detailData.DepartureDate !== 'unknown'
              ? detailData.DepartureDate
              : '미기입'
          }
          ArrivalDate={
            detailData?.ArrivalDate && detailData.ArrivalDate !== 'unknown'
              ? detailData.ArrivalDate
              : '미기입'
          }
          DepartureCity={
            detailData?.DepartureCity && detailData.DepartureCity !== 'unknown'
              ? detailData.DepartureCity
              : '미기입'
          }
          ArrivalCity={
            detailData?.ArrivalCity && detailData.ArrivalCity !== 'unknown'
              ? detailData.ArrivalCity
              : '미기입'
          }
        />
      )}
    </BoardLayout>
  );
};
