/**
 * GameVerse Network Resilience & Packet Recovery Engine
 * Implements packet sequence numbering, ARQ client outbox buffer,
 * exponential backoff retry, packet drop recovery & network interruption reconciliation.
 */

export interface QueuedPacket {
  sequenceNumber: number;
  sessionId: string;
  payload: any;
  timestamp: number;
  attempts: number;
  acknowledged: boolean;
  deliveredAt?: number;
}

export interface NetworkSession {
  sessionId: string;
  isConnected: boolean;
  clientOutbox: QueuedPacket[];
  serverReceivedPackets: Map<number, QueuedPacket>;
  lastAckedSequenceNumber: number;
  nextClientSeq: number;
  serverState: Record<string, any>;
  clientState: Record<string, any>;
  retransmitCount: number;
  droppedPacketsCount: number;
  createdAt: number;
  lastActiveAt: number;
}

export interface SendPacketResult {
  delivered: boolean;
  retries: number;
  sequenceNumber: number;
  latencyMs: number;
  buffered?: boolean;
}

export interface ReconciliationResult {
  reconciled: boolean;
  pendingPacketsDelivered: number;
  finalState: any;
  lastAckedSequenceNumber: number;
  unacknowledgedRemaining: number;
}

export class NetworkResilienceEngine {
  private sessions = new Map<string, NetworkSession>();
  private dropRate = 0.0; // 0.0 to 1.0 (e.g. 0.25 = 25% drop rate)
  private isGlobalDisconnected = false;

  constructor() {
    this.reset();
  }

  /**
   * Resets all sessions and network simulation settings.
   */
  public reset(): void {
    this.sessions.clear();
    this.dropRate = 0.0;
    this.isGlobalDisconnected = false;
  }

  /**
   * Creates or retrieves a reliable network session.
   */
  public createSession(sessionId: string, initialClientState: Record<string, any> = {}): NetworkSession {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      return existing;
    }

    const session: NetworkSession = {
      sessionId,
      isConnected: true,
      clientOutbox: [],
      serverReceivedPackets: new Map<number, QueuedPacket>(),
      lastAckedSequenceNumber: 0,
      nextClientSeq: 1,
      serverState: { ...initialClientState },
      clientState: { ...initialClientState },
      retransmitCount: 0,
      droppedPacketsCount: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Retrieves an existing session by ID.
   */
  public getSession(sessionId: string): NetworkSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Configures simulated packet drop rate (0.0 to 1.0).
   * e.g., 0.25 indicates 25% of packet transmissions will experience simulated transmission loss.
   */
  public simulateDrop(rate: number): void {
    this.dropRate = Math.max(0, Math.min(1, rate));
  }

  /**
   * Returns currently configured drop rate.
   */
  public getDropRate(): number {
    return this.dropRate;
  }

  /**
   * Simulates a network interruption (temporary disconnect) for durationMs.
   */
  public async simulateDisconnect(durationMs: number): Promise<void> {
    this.isGlobalDisconnected = true;
    for (const session of Array.from(this.sessions.values())) {
      session.isConnected = false;
    }

    if (durationMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, durationMs));
      this.isGlobalDisconnected = false;
      for (const session of Array.from(this.sessions.values())) {
        session.isConnected = true;
      }
    }
  }

  /**
   * Manually sets session connection state.
   */
  public setSessionConnected(sessionId: string, isConnected: boolean): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isConnected = isConnected;
    }
  }

  /**
   * Disconnects a specific session.
   */
  public disconnectSession(sessionId: string): void {
    this.setSessionConnected(sessionId, false);
  }

  /**
   * Reconnects a specific session.
   */
  public reconnectSession(sessionId: string): void {
    this.setSessionConnected(sessionId, true);
  }

  /**
   * Sends a packet with ARQ (Automatic Repeat reQuest), client outbox buffering,
   * sequence numbering, and exponential backoff retry.
   */
  public async sendPacket(
    sessionId: string,
    payload: any,
    options: {
      maxRetries?: number;
      baseBackoffMs?: number;
      waitForReconnect?: boolean;
    } = {}
  ): Promise<SendPacketResult> {
    const session = this.sessions.get(sessionId) || this.createSession(sessionId);
    const maxRetries = options.maxRetries ?? 10;
    const baseBackoffMs = options.baseBackoffMs ?? 5;
    const startTime = Date.now();

    // 1. Assign sequential sequence number and enqueue in Client Outbox
    const sequenceNumber = session.nextClientSeq++;
    const packet: QueuedPacket = {
      sequenceNumber,
      sessionId,
      payload,
      timestamp: startTime,
      attempts: 0,
      acknowledged: false,
    };
    session.clientOutbox.push(packet);
    session.lastActiveAt = Date.now();

    // 2. Check if currently disconnected
    const canAttemptTransmission = session.isConnected && !this.isGlobalDisconnected;
    if (!canAttemptTransmission && !options.waitForReconnect) {
      // Packet is safely buffered in client outbox awaiting reconnection/reconciliation
      return {
        delivered: false,
        retries: 0,
        sequenceNumber,
        latencyMs: 0,
        buffered: true,
      };
    }

    // 3. Transmission retry loop with exponential backoff & packet drop handling
    let retries = 0;
    while (retries <= maxRetries) {
      packet.attempts++;

      // If disconnected and waiting for reconnect, pause and retry
      if (!session.isConnected || this.isGlobalDisconnected) {
        if (options.waitForReconnect) {
          await new Promise((r) => setTimeout(r, Math.min(20, baseBackoffMs * 2)));
          retries++;
          continue;
        } else {
          return {
            delivered: false,
            retries,
            sequenceNumber,
            latencyMs: Date.now() - startTime,
            buffered: true,
          };
        }
      }

      // Check simulated packet drop
      const isDropped = this.dropRate > 0 && Math.random() < this.dropRate;
      if (isDropped) {
        session.droppedPacketsCount++;
        session.retransmitCount++;
        retries++;

        if (retries > maxRetries) {
          break;
        }

        // Exponential backoff with small random jitter
        const backoff = Math.min(50, baseBackoffMs * Math.pow(1.5, retries - 1));
        const jitter = Math.floor(Math.random() * 3);
        await new Promise((r) => setTimeout(r, backoff + jitter));
        continue;
      }

      // 4. Packet successfully reached server
      const now = Date.now();
      packet.acknowledged = true;
      packet.deliveredAt = now;

      // Server deduplication check
      if (!session.serverReceivedPackets.has(sequenceNumber)) {
        session.serverReceivedPackets.set(sequenceNumber, packet);

        // Apply state payload mutation to server state
        if (payload && typeof payload === 'object') {
          session.serverState = {
            ...session.serverState,
            ...payload,
          };
        }
      }

      // Update monotonic last acknowledged sequence
      if (sequenceNumber > session.lastAckedSequenceNumber) {
        session.lastAckedSequenceNumber = sequenceNumber;
      }

      // Remove acknowledged packet from outbox buffer
      session.clientOutbox = session.clientOutbox.filter(
        (p) => p.sequenceNumber !== sequenceNumber
      );

      return {
        delivered: true,
        retries,
        sequenceNumber,
        latencyMs: Date.now() - startTime,
        buffered: false,
      };
    }

    // Retries exhausted without acknowledgment; remains in client outbox for reconciliation
    return {
      delivered: false,
      retries,
      sequenceNumber,
      latencyMs: Date.now() - startTime,
      buffered: true,
    };
  }

  /**
   * Reconciles client and server state following a network reconnection.
   * Flushes and delivers all pending client outbox packets in sequence order.
   */
  public reconcileState(sessionId: string): ReconciliationResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        reconciled: false,
        pendingPacketsDelivered: 0,
        finalState: {},
        lastAckedSequenceNumber: 0,
        unacknowledgedRemaining: 0,
      };
    }

    // Restore session connectivity
    session.isConnected = true;

    // Sort pending packets in client outbox in ascending sequence order
    const pendingPackets = [...session.clientOutbox].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );

    let deliveredCount = 0;
    const now = Date.now();

    for (const packet of pendingPackets) {
      // Deliver to server if not already processed (deduplication)
      if (!session.serverReceivedPackets.has(packet.sequenceNumber)) {
        session.serverReceivedPackets.set(packet.sequenceNumber, packet);

        if (packet.payload && typeof packet.payload === 'object') {
          // Continuous active telemetry preservation: if heartbeat active seconds are present,
          // merge cleanly without regressing or leaping beyond safety windows
          if (
            typeof packet.payload.activeSeconds === 'number' &&
            typeof session.serverState.activeSeconds === 'number'
          ) {
            session.serverState.activeSeconds = Math.max(
              session.serverState.activeSeconds,
              packet.payload.activeSeconds
            );
          }
          session.serverState = {
            ...session.serverState,
            ...packet.payload,
          };
        }
        deliveredCount++;
      }

      packet.acknowledged = true;
      packet.deliveredAt = now;
      if (packet.sequenceNumber > session.lastAckedSequenceNumber) {
        session.lastAckedSequenceNumber = packet.sequenceNumber;
      }
    }

    // Empty the acknowledged outbox
    session.clientOutbox = [];

    // Sync client state with server final state
    session.clientState = { ...session.serverState };
    session.lastActiveAt = now;

    return {
      reconciled: true,
      pendingPacketsDelivered: deliveredCount,
      finalState: { ...session.serverState },
      lastAckedSequenceNumber: session.lastAckedSequenceNumber,
      unacknowledgedRemaining: session.clientOutbox.length,
    };
  }
}

// Global network resilience singleton
export const networkResilienceEngine = new NetworkResilienceEngine();
