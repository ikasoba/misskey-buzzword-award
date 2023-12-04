export interface Task {
  name: string;
  fn: () => PromiseLike<void> | void;
  withIn?: number;
}

export class TaskRunner {
  private tasks: Task[] = [];
  constructor() {}

  start() {
    Deno.cron("run tasks", "*/12 * * * *", async () => {
      await this.tick();
    });
  }

  async run(fn: Task["fn"], name = "<anonymous>") {
    try {
      await fn();
    } catch {
      this.tasks.push({
        name,
        fn,
        withIn: 1000 * 60 * 60 * 8,
      });
    }
  }

  queueTask(name: string, fn: Task["fn"], withIn?: number) {
    this.tasks.push({
      name,
      fn,
      withIn: withIn && Date.now() + withIn,
    });
  }

  async tick() {
    let length = this.tasks.length;

    console.log(`Start running ${length} tasks.`);

    while (length--) {
      const task = this.tasks.shift()!;

      if (task.withIn && Date.now() > task.withIn) {
        console.warn("Task execution deadline has passed:", task.name);
        continue;
      }

      try {
        await task.fn();
      } catch (err) {
        console.error("failed to run task:", task.name);
        console.error(err);

        this.tasks.push(task);
      }
    }

    console.log(`done.`);
  }
}
