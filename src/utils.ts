import { Endpoints } from "misskey-js/";

export const getStartOfWeek = (date: Date) => {
  const dt = new Date(date);
  dt.setDate(date.getDate() - date.getDay());
  dt.setHours(0);
  dt.setMinutes(0);
  dt.setSeconds(0);
  dt.setMilliseconds(0);

  return dt.getTime();
};

export const filterDuplication = <T>(arr: T[]) => {
  return [...new Set(arr)];
};

type SwitchType<C extends [any, any][], D> = {
  $switch: {
    $cases: C;
    $default: D;
  };
};

type ProcessSwitchType<
  Cond,
  T extends SwitchType<[any, any][], any>,
  C extends never[] = []
> = C["length"] extends T["$switch"]["$cases"]["length"]
  ? T["$switch"]["$default"]
  : Cond extends T["$switch"]["$cases"][C["length"]][0]
  ? T["$switch"]["$cases"][C["length"]][1]
  : ProcessSwitchType<Cond, T, [...C, never]>;

export type GetMiApiResult<
  E extends keyof Endpoints,
  P extends Endpoints[E]["req"] = Endpoints[E]["req"]
> = Endpoints[E]["res"] extends SwitchType<[any, any][], any>
  ? ProcessSwitchType<P, Endpoints[E]["res"]>
  : Endpoints[E]["res"];
