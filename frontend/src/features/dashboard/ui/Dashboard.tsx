import React, { useEffect, useState } from 'react';
import { ReactComponent as MailCheckIcon } from 'shared/assets/icons/mail-check.svg';
import { ReactComponent as CalendarIcon } from 'shared/assets/icons/calendar.svg';
// import busybee3 from 'shared/assets/images/busybee2.png';
import BoardLayout from 'shared/components/BoardLayout';
import styles from './DashBoard.module.scss';

import { Map } from 'features';
import { Step } from './Step';
import { sendToLambda, useAuth } from '../..';
import { CountByDate } from '../../../shared/utils/getCountByDate';
// import { CountInProgressQuotes } from 'features/mail/utils/estimate';
import { getTodayOrderMail } from 'features/mail/utils/estimate';
import { getMonthOrderMail } from 'features/mail/utils/estimate';
import { RowData } from '../model/boardmodel';
import { sortByReceivedDate } from 'features/mail/utils/sort';

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

  useEffect(() => {
    if (detailEstimateView?.data?.S) {
      setDetailData(JSON.parse(detailEstimateView.data.S));
    }
  }, [detailEstimateView]);

  const [selectIndex, setSelectIndex] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  // // 샘플 데이터
  // const rows = [
  //   {
  //     requester: 'dd@gmail.com',
  //     date: '2024.11.05',
  //     stage: '60%',
  //     status: '진행중',
  //   },
  //   {
  //     requester: 'aa@gmail.com',
  //     date: '2024.11.06',
  //     stage: '30%',
  //     status: '대기중',
  //   },
  // ];

  const selectedStyle = {
    backgroundColor: 'var(--sub01)', // 하늘색 배경
  };

  const handleTodayMailClick = () => {
    setPaginatedRows(todayRows);
    setVisibleCount(3);
    setShowAll(false);
    setSelectIndex(null);
  };

  const handleMonthMailClick = () => {
    setPaginatedRows(monthRows);
    setVisibleCount(3);
    setShowAll(false);
    setSelectIndex(null);
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
    if (selectIndex !== null) {
      const selectedEstimate = paginatedRows[selectIndex];
      setDetailEstimateView(selectedEstimate);
    }
  };

  return (
    <BoardLayout>
      <div className={styles.dashboard}>
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
                <th>견적요청처</th>
                <th>요청날짜</th>
                <th>단계</th>
                <th>완료여부</th>
              </thead>
              <tbody>
                {paginatedRows.slice(0, visibleCount).map((row: RowData, index) => (
                  <tr
                    key={index}
                    className={styles.line}
                    style={selectIndex === index ? selectedStyle : {}}
                    onClick={() => setSelectIndex(index)}
                  >
                    <td>{row.sender.S}</td>
                    <td>{row.received_date.S}</td>
                    <td>
                      <div className={styles.stage}>
                        <p>{row.status.N * 20} %</p>
                        <div className={styles.progressBarContainer}>
                          <div
                            className={styles.progressBar}
                            style={{ width: `${row.status.N * 20}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td> {row.status.N === 5 ? '완료' : '진행중'} </td>
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
        <div className={styles.bottom}>
          <div className={styles.detailquote}>
            <div>
              <h1>ss@gmail.com 님의 견적 요청 자세히보기</h1>
              <button className={styles.textbutton}>메일보내기</button>
            </div>
            <table>
              <thead>
                <th>무게</th>
                <th>컨테이너 사이즈</th>
                <th>출발 날짜</th>
                <th>도착 날짜</th>
                <th>출발 도시</th>
                <th>도착 도시</th>
              </thead>
              <tbody>
                <tr>
                  <td>{detailData?.Weight}</td>
                  <td>{detailData?.ContainerSize}</td>
                  <td>{detailData?.DepartureDate}</td>
                  <td>{detailData?.ArrivalDate}</td>
                  <td>{detailData?.DepartureCity}</td>
                  <td>{detailData?.DepartureCity}</td>
                </tr>
              </tbody>
            </table>
            <div className={styles.barSection}>
              <Step currentStep={3} />
            </div>
            <div className={styles.detail}>
              <div className={styles.detailTop}>
                <div className={styles.topHalf}>
                  <h1>현재 위치</h1>
                </div>
                <div className={styles.topHalf}>
                  <h1>운송 상태</h1>
                </div>
              </div>
              <div className={styles.detailBottom}>
                <div className={styles.map}>
                  <Map />
                </div>
                <div className={styles.bottomRight}>
                  <div className={styles.col}>
                    <h2>열림 감지</h2>
                    <div className={styles.square}>ON</div>
                  </div>
                  <div className={styles.col}>
                    <h2>내부 온도</h2>
                    <div className={styles.square}>25도</div>
                  </div>
                  <div className={styles.col}>
                    <h2>내부 습도</h2>
                    <div className={styles.square}>23%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BoardLayout>
  );
};
