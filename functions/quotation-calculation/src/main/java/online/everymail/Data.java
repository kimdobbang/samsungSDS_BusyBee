package online.everymail;

import com.google.gson.annotations.SerializedName;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class Data {
    @SerializedName("Weight")
    private int weight;

    @SerializedName("ContainerSize")
    private int containerSize;

    @SerializedName("DepartureDate")
    private String departureDate;

    @SerializedName("ArrivalDate")
    private String arrivalDate;

    @SerializedName("DepartureCity")
    private String departureCity;

    @SerializedName("ArrivalCity")
    private String arrivalCity;
}
