import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Int "mo:core/Int";
import List "mo:core/List";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
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

  type UserProfile = {
    name : Text;
    bio : Text;
    avatarUrl : Text;
    skills : [Text];
  };

  type ProfileEntry = {
    owner : Principal;
    profile : UserProfile;
  };

  type MatchEntry = {
    matched : Principal;
    profile : UserProfile;
    mutual : Bool;
  };

  type Message = {
    id : Text;
    from : Principal;
    to : Principal;
    text : Text;
    createdAt : Int;
  };

  let matches = Map.empty<Text, Match>();
  let profiles = Map.empty<Principal, UserProfile>();
  let userMatches = Map.empty<Principal, Set.Set<Principal>>();
  let messages = Map.empty<Text, Message>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var idCounter = 0;

  func generateId() : Text {
    let id = idCounter;
    idCounter += 1;
    id.toText();
  };

  // Auto-register caller as #user if not yet registered (fixes race condition)
  func autoRegister(caller : Principal) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      AccessControl.initialize(accessControlState, caller, "", "");
    };
  };

  func areMutual(a : Principal, b : Principal) : Bool {
    let aSet = switch (userMatches.get(a)) {
      case (?s) { s };
      case (null) { Set.empty<Principal>() };
    };
    let bSet = switch (userMatches.get(b)) {
      case (?s) { s };
      case (null) { Set.empty<Principal>() };
    };
    aSet.contains(b) and bSet.contains(a);
  };

  public shared ({ caller }) func registerMe() : async () {
    if (caller.isAnonymous()) { Runtime.trap("Anonymous not allowed") };
    AccessControl.initialize(accessControlState, caller, "", "");
  };

  public shared ({ caller }) func createMatch(sport : Text, title : Text, time : Text, location : Text, missing : Int) : async Text {
    autoRegister(caller);
    let id = generateId();
    let newMatch : Match = { id; sport; title; time; location; missing; createdAt = Time.now() };
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
    autoRegister(caller);
    switch (matches.get(id)) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        if (match.missing <= 0) { Runtime.trap("No missing players") };
        let updatedMatch : Match = {
          id = match.id; sport = match.sport; title = match.title;
          time = match.time; location = match.location;
          missing = match.missing - 1; createdAt = match.createdAt;
        };
        matches.add(id, updatedMatch);
      };
    };
  };

  public query ({ caller }) func getMyProfile() : async ?UserProfile {
    profiles.get(caller);
  };

  public shared ({ caller }) func updateMyProfile(name : Text, bio : Text, avatarUrl : Text, skills : [Text]) : async () {
    // Auto-register to fix race condition - no longer traps if user isn't pre-registered
    autoRegister(caller);
    let profile : UserProfile = { name; bio; avatarUrl; skills };
    profiles.add(caller, profile);
  };

  public query func getAllProfiles() : async [ProfileEntry] {
    profiles.entries().toArray().map(func((owner, profile)) {
      { owner; profile };
    });
  };

  public shared ({ caller }) func matchWithUser(target : Principal) : async () {
    autoRegister(caller);
    if (caller == target) { Runtime.trap("Cannot match with yourself") };
    let existing = switch (userMatches.get(caller)) {
      case (?s) { s };
      case (null) { Set.empty<Principal>() };
    };
    existing.add(target);
    userMatches.add(caller, existing);
  };

  public query ({ caller }) func getMyMatches() : async [MatchEntry] {
    let mySet = switch (userMatches.get(caller)) {
      case (?s) { s };
      case (null) { Set.empty<Principal>() };
    };
    mySet.toArray().filterMap(func(matched) {
      switch (profiles.get(matched)) {
        case (null) { null };
        case (?profile) {
          let theirSet = switch (userMatches.get(matched)) {
            case (?s) { s };
            case (null) { Set.empty<Principal>() };
          };
          let mutual = theirSet.contains(caller);
          ?{ matched; profile; mutual };
        };
      };
    });
  };

  public shared ({ caller }) func sendMessage(to : Principal, text : Text) : async Text {
    autoRegister(caller);
    if (not areMutual(caller, to)) {
      Runtime.trap("Cannot message: not a mutual match");
    };
    let id = generateId();
    let msg : Message = { id; from = caller; to; text; createdAt = Time.now() };
    messages.add(id, msg);
    id;
  };

  public query ({ caller }) func getMessages(withUser : Principal) : async [Message] {
    let all = messages.values().toArray();
    let filtered = all.filter(func(m : Message) : Bool {
      (m.from == caller and m.to == withUser) or
      (m.from == withUser and m.to == caller)
    });
    filtered.sort(func(a : Message, b : Message) : Order.Order {
      Int.compare(a.createdAt, b.createdAt)
    });
  };
};
