import { View } from "react-native";

import { Avatar, Display, Eyebrow, Screen, SectionLabel, Text, Tile } from "@/ui";

export default function Home() {
  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Eyebrow>Tue 11 Nov · Rhinon Tech</Eyebrow>
        <Avatar name="Kabir Mehra" />
      </View>
      <Display style={{ marginTop: 12 }}>{"Morning,\nKabir."}</Display>
      <Text style={{ marginTop: 14, opacity: 0.6, lineHeight: 22 }}>Five approvals are waiting and your standup is at 10:30.</Text>
      <SectionLabel>Your day</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Tile name="violet" label="Approvals" stat="Waiting on you" badge={5} wide />
        <Tile name="leaf" label="Clock" stat="Not in yet" />
        <Tile name="sky" label="Leave" stat="5 days left" />
        <Tile name="sun" label="Pay" stat="Oct paid" />
        <Tile name="rose" label="CRM" stat="₹12.4L open" />
      </View>
    </Screen>
  );
}
