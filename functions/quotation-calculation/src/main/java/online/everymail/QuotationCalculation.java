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

                    MessageData newData = new MessageData(parsedData, quote);

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
    private double calculateTransportCost(int weight, int containerSize, String departureCity,
                                         String arrivalCity, String departureDate, String arrivalDate) {
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
        cityCoordinatesMap.put("SEL", new CityCoordinates(37.5665, 126.9780)); // 서울
        cityCoordinatesMap.put("ICN", new CityCoordinates(37.4563, 126.7052)); // 인천
        cityCoordinatesMap.put("PUS", new CityCoordinates(35.1796, 129.0756)); // 부산
        cityCoordinatesMap.put("TAE", new CityCoordinates(35.8714, 128.6014)); // 대구
        cityCoordinatesMap.put("DCC", new CityCoordinates(36.3504, 127.3845)); // 대전
        cityCoordinatesMap.put("KWJ", new CityCoordinates(35.1595, 126.8526)); // 광주
        cityCoordinatesMap.put("USN", new CityCoordinates(35.5384, 129.3114)); // 울산
        cityCoordinatesMap.put("CJU", new CityCoordinates(33.4996, 126.5312)); // 제주
        cityCoordinatesMap.put("GMP", new CityCoordinates(37.5559, 126.8360)); // 김포
        cityCoordinatesMap.put("KPO", new CityCoordinates(36.0190, 129.3435)); // 포항
        cityCoordinatesMap.put("YNY", new CityCoordinates(38.0613, 128.6695)); // 양양
        cityCoordinatesMap.put("CJJ", new CityCoordinates(36.6420, 127.4890)); // 청주
        cityCoordinatesMap.put("WJU", new CityCoordinates(37.3420, 127.9200)); // 원주
        cityCoordinatesMap.put("KUV", new CityCoordinates(35.9038, 126.6155)); // 군산
        cityCoordinatesMap.put("RSU", new CityCoordinates(34.8428, 127.6161)); // 여수
        cityCoordinatesMap.put("HIN", new CityCoordinates(35.0880, 128.0706)); // 사천
        cityCoordinatesMap.put("MPK", new CityCoordinates(34.8118, 126.3922)); // 목포
        cityCoordinatesMap.put("SHO", new CityCoordinates(38.2070, 128.5919)); // 속초
        cityCoordinatesMap.put("KAG", new CityCoordinates(37.7519, 128.8761)); // 강릉
        cityCoordinatesMap.put("CNX", new CityCoordinates(37.8813, 127.7298)); // 춘천
        cityCoordinatesMap.put("AEO", new CityCoordinates(36.5684, 128.7294)); // 안동
        cityCoordinatesMap.put("CHN", new CityCoordinates(35.8218, 127.1480)); // 전주
        cityCoordinatesMap.put("SCK", new CityCoordinates(37.4499, 129.1658)); // 삼척

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