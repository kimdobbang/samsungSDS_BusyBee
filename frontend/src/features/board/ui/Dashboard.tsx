import React, { useState } from 'react';
import { ReactComponent as MailCheckIcon } from 'shared/assets/icons/mail-check.svg';
import busybee3 from 'shared/assets/images/busybee2.png';
import BoardLayout from './BoardLayout';
import styles from './DashBoard.module.scss';
export const Dashboard = () => {
  const [showMore, setShowMore] = useState(false);

  // 샘플 데이터
  const rows = [
    { requester: 'dd@gmail.com', date: '2024.11.05', stage: '60%', status: '진행중' },
    { requester: 'aa@gmail.com', date: '2024.11.06', stage: '30%', status: '대기중' },
    { requester: 'bb@gmail.com', date: '2024.11.07', stage: '90%', status: '완료' },
    { requester: 'cc@gmail.com', date: '2024.11.08', stage: '20%', status: '대기중' },
    { requester: 'ee@gmail.com', date: '2024.11.09', stage: '75%', status: '진행중' },
    { requester: 'ff@gmail.com', date: '2024.11.10', stage: '100%', status: '완료' },
    { requester: 'gg@gmail.com', date: '2024.11.11', stage: '45%', status: '진행중' },
    { requester: 'hh@gmail.com', date: '2024.11.12', stage: '15%', status: '대기중' },
    { requester: 'ii@gmail.com', date: '2024.11.13', stage: '85%', status: '진행중' },
    { requester: 'jj@gmail.com', date: '2024.11.14', stage: '50%', status: '진행중' },
    { requester: 'kk@gmail.com', date: '2024.11.15', stage: '40%', status: '대기중' },
    // 더 많은 데이터 추가 가능
  ];

  // 첫 3개 행만 보여주고, 나머지는 더보기 버튼으로 제어
  const displayedRows = showMore ? rows : rows.slice(0, 3);

  return (
    <BoardLayout>
      <div className={styles.dashboard}>
        <div className={styles.top}>
          <div className={styles.statisticbox}>
            <div className={styles.statistics}>
              <h2>오늘 견적 요청 메일</h2>
              <h3>16건</h3>
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
              <h3>160건</h3>
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
                <h2>30건 발급 진행중</h2>
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
              <button onClick={() => setShowMore(!showMore)} className={styles.moreButton}>
                더보기
              </button>
            )}
            {showMore && (
              <button onClick={() => setShowMore(!showMore)} className={styles.moreButton}>
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
