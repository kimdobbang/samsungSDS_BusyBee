import React, { useEffect, useState } from 'react';
import { ReactComponent as MailCheckIcon } from 'shared/assets/icons/mail-check.svg';
import busybee3 from 'shared/assets/images/busybee2.png';
import BoardLayout from './BoardLayout';
import styles from './DashBoard.module.scss';
import { sendToLambda, useAuth } from '../..';
import { CountByDate } from '../../../shared/utils/getCountByDate';
import { CountInProgressQuotes } from '../utils/estimate';

export const Dashboard = () => {
  const [, authEmail] = useAuth() || [];
  const email = typeof authEmail === 'string' ? authEmail : '';
  const [showMore, setShowMore] = useState(false);
  const [countToday, setTodayCount] = useState(0);
  const [countMonthly, setMonthlyCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);

  useEffect(() => {
    const fetchLambdaData = async () => {
      try {
        const res = await sendToLambda(email);

        console.log(res);
        const { todayCount, monthCount } = CountByDate(res);
        setTodayCount(todayCount);
        setMonthlyCount(monthCount);

        const inProgressQuotesCount = CountInProgressQuotes(res);
        setInProgressCount(inProgressQuotesCount);
      } catch (error) {
        console.error('Error fetching data from Lambda:', error);
      }
    };
    fetchLambdaData();
  });

  // 샘플 데이터
  const rows = [
    {
      requester: 'dd@gmail.com',
      date: '2024.11.05',
      stage: '60%',
      status: '진행중',
    },
    {
      requester: 'aa@gmail.com',
      date: '2024.11.06',
      stage: '30%',
      status: '대기중',
    },
  ];

  const displayedRows = showMore ? rows : rows.slice(0, 3);

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
              <div className={styles.iconbutton}>
                <MailCheckIcon width={28} height={28} />
              </div>
            </div>
          </div>
          <div className={styles.statisticbox}>
            <div className={styles.statistics}>
              <h2>월간 요청 메일</h2>
              <h3>{countMonthly}건</h3>
            </div>
            <div className={styles.iconbutton}>
              <MailCheckIcon width={28} height={28} />
            </div>
          </div>
          <div className={styles.statisticbox}>
            <div className={styles.statistics}>
              <h2>견적 발급 자동화 성공률</h2>
              <h3>95%</h3>
            </div>
            <div className={styles.iconbutton}>
              <MailCheckIcon width={28} height={28} />
            </div>
          </div>
        </div>
        <div className={`${styles.middle} ${showMore ? styles.expanded : ''}`}>
          <div className={styles.quotebox}>
            <div className={styles.middleHeader}>
              <div>
                <h1>진행중인 견적</h1>
                <h2>{inProgressCount}건 발급 진행중</h2>
              </div>
              <button className={styles.textbutton}>조회하기</button>
            </div>
            <table>
              <thead>
                <th>견적요청처</th>
                <th>요청날짜</th>
                <th>단계</th>
                <th>완료여부</th>
              </thead>
              <tbody>
                {displayedRows.map((row, index) => (
                  <tr key={index}>
                    <td>dd@gmail.com</td>
                    <td>2024.11.05</td>
                    <td>
                      <div className={styles.stage}>
                        <p>60%</p>
                        <div className={styles.progressBarContainer}>
                          <div className={styles.progressBar}></div>
                        </div>
                      </div>
                    </td>
                    <td>진행중</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!showMore && (
              <button
                onClick={() => setShowMore(!showMore)}
                className={styles.moreButton}
              >
                더보기
              </button>
            )}
            {showMore && (
              <button
                onClick={() => setShowMore(!showMore)}
                className={styles.moreButton}
              >
                닫기
              </button>
            )}
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.detailquote}>
            <h1>ss@gmail.com 님의 견적 요청 자세히보기</h1>
            <div>숫자선</div>
            <div className={styles.detail}>
              <div className={styles.left}>
                <h1>현재 위치</h1>
                <div className={styles.map}>지도</div>
              </div>
              <div className={styles.right}>
                <h1>배송 상태</h1>
                <div>
                  <div className={styles.col}>
                    <h2>카메라</h2>
                    <img src={busybee3} alt='' />
                  </div>
                  <div className={styles.col}>
                    <h2>내부온도</h2>
                    <div className={styles.square}>25도</div>
                  </div>
                  <div className={styles.col}>
                    <h2>내부습도</h2>
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
