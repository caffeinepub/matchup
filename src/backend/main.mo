import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Int "mo:core/Int";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Type definition
  type Match = {
    id : Text;
    sport : Text;
    title : Text;
    time : Text;
    location : Text;
    missing : Int;
    createdAt : Int;
  };
  module Match {
    public func compare(match1 : Match, match2 : Match) : Order.Order {
      Text.compare(match1.id, match2.id);
    };
  };

  // State
  let matches = Map.empty<Text, Match>();

  // Authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Generate unique IDs using a persistent counter
  var idCounter = 0;

  // Helper function to generate unique IDs
  func generateId() : Text {
    let id = idCounter;
    idCounter += 1;
    id.toText();
  };

  // Public methods

  public shared ({ caller }) func createMatch(sport : Text, title : Text, time : Text, location : Text, missing : Int) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create matches");
    };
    let id = generateId();
    let newMatch : Match = {
      id;
      sport;
      title;
      time;
      location;
      missing;
      createdAt = Time.now();
    };
    matches.add(id, newMatch);
    id;
  };

  public query ({ caller }) func getAllMatches() : async [Match] {
    matches.values().toArray().sort();
  };

  public shared ({ caller }) func deleteMatch(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete matches");
    };
    if (not matches.containsKey(id)) { Runtime.trap("Match not found") };
    matches.remove(id);
  };

  public query ({ caller }) func searchMatchesBySport(sport : Text) : async [Match] {
    matches.values().toArray().sort().filter(func(m) { m.sport.contains(#text sport) });
  };

  public query ({ caller }) func searchMatchesByLocation(location : Text) : async [Match] {
    matches.values().toArray().sort().filter(func(m) { m.location.contains(#text location) });
  };

  public shared ({ caller }) func joinMatch(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join matches");
    };
    switch (matches.get(id)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        if (match.missing <= 0) { Runtime.trap("No missing players") };
        let updatedMatch : Match = {
          id = match.id;
          sport = match.sport;
          title = match.title;
          time = match.time;
          location = match.location;
          missing = match.missing - 1;
          createdAt = match.createdAt;
        };
        matches.add(id, updatedMatch);
      };
    };
  };
};
