package online.everymail;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.sns.AmazonSNS;
import com.amazonaws.services.sns.AmazonSNSClientBuilder;
import com.amazonaws.services.sns.model.PublishRequest;
import com.amazonaws.services.sns.model.PublishResult;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import lombok.AllArgsConstructor;
import online.everymail.dto.MessageData;
import online.everymail.dto.SQSMessageData;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.concurrent.TimeUnit;

public class QuotationCalculation implements RequestHandler<SQSEvent, Void> {

    private static final AmazonSNS snsClient = AmazonSNSClientBuilder.defaultClient();
    private static final String snsTopicArn = "arn:aws:sns:ap-northeast-2:481665114066:save-data";
    private static final Gson gson = new Gson();

    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        if (event.getRecords() != null && !event.getRecords().isEmpty()) {
            for (SQSEvent.SQSMessage message : event.getRecords()) {
                try {
                    String originalMessageBody = message.getBody();
                    context.getLogger().log("Received message: " + originalMessageBody);

                    SQSMessageData parsedData = gson.fromJson(originalMessageBody, SQSMessageData.class);

                    // 무게 (단위 : kg)
                    int weight = parsedData.getData().getWeight();
                    // 컨테이너 사이즈 (1: 20ft, 2: 40ft, 3: 40ft HC, 4: 45ft)
                    int containerSize = parsedData.getData().getContainerSize();
                    // 출발 날짜
                    String departureDate = parsedData.getData().getDepartureDate();
                    // 도착 날짜
                    String arrivalDate = parsedData.getData().getArrivalDate();
                    // 출발 도시
                    String departureCity = parsedData.getData().getDepartureCity();
                    // 도착 도시
                    String arrivalCity = parsedData.getData().getArrivalCity();

                    // 견적 계산
                    int quote = (int) Math.round(calculateTransportCost(
                            weight, containerSize, departureDate, arrivalDate, departureCity, arrivalCity));

                    MessageData newData = new MessageData(parsedData, 2, quote);

                    String newMessageBody = gson.toJson(newData);

                    context.getLogger().log("Sending to SNS for further handling.");

                    PublishRequest publishRequest = new PublishRequest()
                            .withTopicArn(snsTopicArn)
                            .withMessage(newMessageBody);

                    PublishResult publishResult = snsClient.publish(publishRequest);
                    context.getLogger().log("Message published to SNS with message ID: " + publishResult.getMessageId());
                } catch (JsonSyntaxException e) {
                    context.getLogger().log("Error parsing message: " + e.getMessage());
                } catch (Exception e) {
                    context.getLogger().log("Unexpected error: " + e.getMessage());
                }
            }
        } else {
            context.getLogger().log("No message received.");
        }
        return null;
    }

    // 운송 비용 계산 메서드
    private double calculateTransportCost(int weight, int containerSize, String departureDate,
                                          String arrivalDate, String departureCity, String arrivalCity) {
        // 기본 요금 설정 (1,000,000원)
        double baseCost = 1_000_000.0;

        // 도시 간 거리 가중치 (단위: km / 100)
        double distanceFactor = getDistance(departureCity, arrivalCity) / 100.0;

        // 컨테이너 크기별 요금 가중치
        double containerMultiplier;
        switch (containerSize) {
            case 1: // 20ft
                containerMultiplier = 1.0;
                break;
            case 2: // 40ft
                containerMultiplier = 1.5;
                break;
            case 3: // 40ft HC
                containerMultiplier = 1.75;
                break;
            case 4: // 45ft
                containerMultiplier = 2.0;
                break;
            default:
                throw new IllegalArgumentException("Invalid container size");
        }

        // 무게당 추가 요금 (예: kg당 100원)
        double weightCost = weight * 100.0;

        // 출발-도착 날짜 차이에 따른 급행 요금 (예: 7일 이하의 경우 20% 추가 요금)
        long daysBetween = getDaysBetween(departureDate, arrivalDate);
        double expressFee = (daysBetween <= 7) ? 1.2 : 1.0;

        // 총 비용 계산
        double totalCost = baseCost + (distanceFactor * containerMultiplier * 1_000_000) + weightCost;
        totalCost *= expressFee;

        return totalCost;
    }

    // 도시 간 거리 가중치 계산 메소드
    private double getDistance(String departureCity, String arrivalCity) {
        // 도시별 위도 및 경도 정보 설정
        HashMap<String, CityCoordinates> cityCoordinatesMap = new HashMap<>();

        // Major cities
        cityCoordinatesMap.put("SEL", new CityCoordinates(37.5665, 126.9780)); // 서울
        cityCoordinatesMap.put("ICN", new CityCoordinates(37.4563, 126.7052)); // 인천
        cityCoordinatesMap.put("PUS", new CityCoordinates(35.1796, 129.0756)); // 부산
        cityCoordinatesMap.put("TAE", new CityCoordinates(35.8714, 128.6014)); // 대구
        cityCoordinatesMap.put("DCC", new CityCoordinates(36.3504, 127.3845)); // 대전
        cityCoordinatesMap.put("KWJ", new CityCoordinates(35.1595, 126.8526)); // 광주
        cityCoordinatesMap.put("USN", new CityCoordinates(35.5384, 129.3114)); // 울산
        cityCoordinatesMap.put("CJU", new CityCoordinates(33.4996, 126.5312)); // 제주
        cityCoordinatesMap.put("SWU", new CityCoordinates(37.2636, 127.0286)); // 수원
        cityCoordinatesMap.put("SNM", new CityCoordinates(37.4200, 127.1267)); // 성남
        cityCoordinatesMap.put("CHN", new CityCoordinates(37.8813, 127.7298)); // 춘천
        cityCoordinatesMap.put("GRN", new CityCoordinates(37.7519, 128.8761)); // 강릉

        // Airports
        cityCoordinatesMap.put("GMP", new CityCoordinates(37.5587, 126.7906)); // 김포공항
        cityCoordinatesMap.put("CJJ", new CityCoordinates(36.7166, 127.4995)); // 청주공항
        cityCoordinatesMap.put("RSU", new CityCoordinates(34.8428, 127.6161)); // 여수공항
        cityCoordinatesMap.put("KPO", new CityCoordinates(36.0190, 129.3435)); // 포항공항
        cityCoordinatesMap.put("YNY", new CityCoordinates(38.0589, 128.6695)); // 양양공항
        cityCoordinatesMap.put("WJU", new CityCoordinates(37.4386, 127.9596)); // 원주공항
        cityCoordinatesMap.put("MWX", new CityCoordinates(34.9914, 126.3828)); // 무안공항
        cityCoordinatesMap.put("HIN", new CityCoordinates(35.0880, 128.0706)); // 사천공항

        // Train stations
        cityCoordinatesMap.put("SEO", new CityCoordinates(37.5547, 126.9707)); // 서울역
        cityCoordinatesMap.put("YON", new CityCoordinates(37.5311, 126.9644)); // 용산역
        cityCoordinatesMap.put("PSN", new CityCoordinates(35.1152, 129.0413)); // 부산역
        cityCoordinatesMap.put("DJC", new CityCoordinates(36.3511, 127.3850)); // 대전역
        cityCoordinatesMap.put("GWJ", new CityCoordinates(35.1517, 126.8475)); // 광주송정역
        cityCoordinatesMap.put("DDG", new CityCoordinates(35.8801, 128.6286)); // 동대구역
        cityCoordinatesMap.put("IKS", new CityCoordinates(35.9733, 126.7118)); // 익산역
        cityCoordinatesMap.put("JJR", new CityCoordinates(35.8252, 127.1478)); // 전주역
        cityCoordinatesMap.put("MKP", new CityCoordinates(34.8118, 126.3922)); // 목포역
        cityCoordinatesMap.put("POH", new CityCoordinates(36.0194, 129.3444)); // 포항역

        cityCoordinatesMap.put("INC", new CityCoordinates(37.4767, 126.6169)); // 인천역
        cityCoordinatesMap.put("CHC", new CityCoordinates(37.8813, 127.7298)); // 춘천역
        cityCoordinatesMap.put("GRG", new CityCoordinates(37.7644, 128.8961)); // 강릉역
        cityCoordinatesMap.put("SUS", new CityCoordinates(37.4876, 127.1010)); // 수서역
        cityCoordinatesMap.put("YSR", new CityCoordinates(34.7604, 127.6622)); // 여수엑스포역

        // Ports
        cityCoordinatesMap.put("BPH", new CityCoordinates(35.1045, 129.0374)); // 부산항
        cityCoordinatesMap.put("IPH", new CityCoordinates(37.4763, 126.6198)); // 인천항
        cityCoordinatesMap.put("UPH", new CityCoordinates(35.5019, 129.3844)); // 울산항
        cityCoordinatesMap.put("PTH", new CityCoordinates(36.9855, 126.6046)); // 평택항
        cityCoordinatesMap.put("YHP", new CityCoordinates(34.7418, 127.7353)); // 여수항
        cityCoordinatesMap.put("MHP", new CityCoordinates(34.7917, 126.3886)); // 목포항
        cityCoordinatesMap.put("SCH", new CityCoordinates(37.5665, 126.9780)); // 삼천포항/속초항
        cityCoordinatesMap.put("MSH", new CityCoordinates(35.2026, 128.5831)); // 마산항
        cityCoordinatesMap.put("JHH", new CityCoordinates(35.1494, 128.6838)); // 진해항
        cityCoordinatesMap.put("GSH", new CityCoordinates(35.9673, 126.7364)); // 군산항

        cityCoordinatesMap.put("PHP", new CityCoordinates(36.0325, 129.3650)); // 포항항
        cityCoordinatesMap.put("JPH", new CityCoordinates(33.5178, 126.5261)); // 제주항
        cityCoordinatesMap.put("GPH", new CityCoordinates(34.9333, 127.7025)); // 광양항
        cityCoordinatesMap.put("DHH", new CityCoordinates(37.4813, 129.1259)); // 동해항

        // Additional locations
        cityCoordinatesMap.put("SSH", new CityCoordinates(36.7810, 126.4503)); // 서산항
        cityCoordinatesMap.put("TAH", new CityCoordinates(36.7535, 126.2976)); // 태안항
        cityCoordinatesMap.put("ULH", new CityCoordinates(37.4885, 130.9061)); // 울릉항
        cityCoordinatesMap.put("DDH", new CityCoordinates(37.2411, 131.8644)); // 독도항
        cityCoordinatesMap.put("CFT", new CityCoordinates(37.4670, 126.6176)); // 화물터미널
        cityCoordinatesMap.put("ILB", new CityCoordinates(37.4639, 126.6325)); // 국제물류기지
        cityCoordinatesMap.put("NHN", new CityCoordinates(34.8370, 127.8975)); // 남해항
        cityCoordinatesMap.put("GJH", new CityCoordinates(34.8803, 128.6214)); // 거제항

        // International Ports and Airports (for reference)
        cityCoordinatesMap.put("SHA", new CityCoordinates(31.2304, 121.4737)); // 상하이항
        cityCoordinatesMap.put("HKG", new CityCoordinates(22.3193, 114.1694)); // 홍콩항
        cityCoordinatesMap.put("SIN", new CityCoordinates(1.3521, 103.8198)); // 싱가포르항
        cityCoordinatesMap.put("TYO", new CityCoordinates(35.6895, 139.6917)); // 도쿄항
        cityCoordinatesMap.put("NYH", new CityCoordinates(40.7128, -74.0060)); // 뉴욕항
        cityCoordinatesMap.put("LAH", new CityCoordinates(34.0522, -118.2437)); // 로스앤젤레스항
        cityCoordinatesMap.put("LDH", new CityCoordinates(51.5074, -0.1278)); // 런던항
        cityCoordinatesMap.put("HAM", new CityCoordinates(53.5511, 9.9937)); // 함부르크항
        cityCoordinatesMap.put("DXB", new CityCoordinates(25.276987, 55.296249)); // 두바이항


        // 두 도시 간의 실제 거리 계산
        CityCoordinates city1 = cityCoordinatesMap.get(departureCity);
        CityCoordinates city2 = cityCoordinatesMap.get(arrivalCity);

        if (city1 == null || city2 == null) {
            throw new IllegalArgumentException("Invalid city name");
        }

        return calculateDistance(city1, city2);
    }

    // 두 지점 간의 대원거리 계산 함수 (Haversine 공식)
    private double calculateDistance(CityCoordinates city1, CityCoordinates city2) {
        final int EARTH_RADIUS = 6371; // 지구 반지름 (단위: km)

        double latDistance = Math.toRadians(city2.latitude - city1.latitude);
        double lonDistance = Math.toRadians(city2.longitude - city1.longitude);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(city1.latitude)) * Math.cos(Math.toRadians(city2.latitude))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }

    // 날짜 차이 계산 메소드
    private long getDaysBetween(String departureDate, String arrivalDate) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Date depDate = sdf.parse(departureDate);
            Date arrDate = sdf.parse(arrivalDate);
            long diffInMillies = Math.abs(arrDate.getTime() - depDate.getTime());
            return TimeUnit.DAYS.convert(diffInMillies, TimeUnit.MILLISECONDS);
        } catch (ParseException e) {
            throw new RuntimeException("Invalid date format", e);
        }
    }

    // 도시 좌표 클래스
    @AllArgsConstructor
    static class CityCoordinates {
        double latitude;
        double longitude;
    }
}