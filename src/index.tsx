import React, {useCallback, useEffect, useRef, useState} from "react";
import ReactDOM from 'react-dom/client';

type SessionInfo = {
    startSum: number;
    totalProfit: number;
    minOffer: number;
    maxOffer: number;
    offersProfit: number;
    offersLoss: number;
    date: string;
}

type Offer = {
    startPrice: number;
    endPrice: number;
};

type StorageSession = {
    date: string,
    info: SessionInfo,
    closeOffers: Offer[] | undefined,
    openOffers: Offer[] | undefined,
    lastOffer: Offer | undefined
}

const App: React.FC = () => {
    const allSessionRef = useRef<HTMLDivElement>(null);
    const [ALL_SESSIONS, setAllSessions] = useState<StorageSession[]>([]);
    const [SESSION, setSessionInfo] = useState<SessionInfo>({
        startSum: 0,
        totalProfit: 0,
        minOffer: 0,
        maxOffer: 0,
        offersProfit: 0,
        offersLoss: 0,
        date: '',
    });
    const [closeOffers, setCloseOffers] = useState<Offer[]>([]);
    const [openOffers, setOpenOffers] = useState<Offer[]>([]);
    const [lastOffer, setLastOffer] = useState<Offer | null>(null);
    const save = useCallback(() => {
        if (SESSION.startSum === 0) return;

        const currentSession = {
            date: SESSION.date,
            info: SESSION,
            closeOffers,
            openOffers,
            lastOffer
        } as StorageSession;
        let allSessionsStorage = localStorage.getItem('allSessions');
        let allSessions: StorageSession[] = (allSessionsStorage ? JSON.parse(allSessionsStorage) : []);
        const currentSessionIndex = allSessions.findIndex(s => s.date === currentSession.date);

        if(currentSessionIndex !== -1) {
            allSessions[currentSessionIndex] = currentSession;
        } else {
            allSessions.unshift(currentSession);
        }

        setAllSessions(allSessions);

        localStorage.setItem("allSessions", JSON.stringify(allSessions));
        localStorage.setItem("session", JSON.stringify(currentSession));
    }, [SESSION, closeOffers, openOffers, lastOffer]);

    useEffect(()=> {
        let storageAllSessions = localStorage.getItem("allSessions");

        if(!storageAllSessions) return;

        console.log(storageAllSessions);

        const parsedStorage = JSON.parse(storageAllSessions) as StorageSession[];

        setAllSessions(parsedStorage);
    }, []);

    useEffect(() => {
        let storageSession = localStorage.getItem("session");

        if(!storageSession) return;

        const parsedStorage = JSON.parse(storageSession) as StorageSession;

        setSessionInfo(parsedStorage.info);

        parsedStorage.closeOffers !== undefined && setCloseOffers(parsedStorage.closeOffers);
        parsedStorage.openOffers !== undefined && setOpenOffers(parsedStorage.openOffers);
        parsedStorage.lastOffer !== undefined && setLastOffer(parsedStorage.lastOffer);
    }, []);

    useEffect(()=> {
        const recalcSession = {
            startSum: SESSION.startSum,
            totalProfit: 0,
            minOffer: 0,
            maxOffer: 0,
            offersProfit: 0,
            offersLoss: 0,
            date: SESSION.date
        } as SessionInfo;

        if(!closeOffers.length || closeOffers.length === 0) return;

        closeOffers.forEach(offer => {
            const offerResult = offer.endPrice - offer.startPrice;

            recalcSession.totalProfit += offerResult;
            recalcSession.minOffer = (recalcSession.minOffer < offerResult ? parseFloat(recalcSession.minOffer.toFixed(2)) : offerResult);
            recalcSession.maxOffer = (recalcSession.maxOffer > offerResult ? parseFloat(recalcSession.maxOffer.toFixed(2)) : offerResult);
            recalcSession.offersProfit += (offerResult > 0 ? offerResult : 0);
            recalcSession.offersLoss += (offerResult < 0 ? offerResult : 0);
        });

        recalcSession.totalProfit = parseFloat(recalcSession.totalProfit.toFixed(2));
        recalcSession.offersProfit = parseFloat(recalcSession.offersProfit.toFixed(2));
        recalcSession.offersLoss = parseFloat(recalcSession.offersLoss.toFixed(2));

        setSessionInfo(recalcSession);
    }, [closeOffers]);

    useEffect(() => {
        save();
    }, [save]);

    function setStartSumHandler({currentTarget}: React.MouseEvent<HTMLButtonElement>) {
        const sum = currentTarget.parentElement?.querySelector('input');

        if(!sum || Number(sum.value) <= 0) return;

        const date = new Date();

        setSessionInfo(() => ({
            startSum: Number(sum.value),
            totalProfit: 0,
            minOffer: 0,
            maxOffer: 0,
            offersProfit: 0,
            offersLoss: 0,
            date: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        }));
    }

    function addNewOfferHandler({currentTarget}: React.MouseEvent<HTMLButtonElement>|React.KeyboardEvent<HTMLInputElement>) {
        const startPriceInput = currentTarget.parentElement!.querySelector('input[name="start-price"]') as HTMLInputElement;
        const endPriceInput = currentTarget.parentElement!.querySelector('input[name="end-price"]') as HTMLInputElement;
        const startPrice = Number(startPriceInput.value);
        const endPrice = Number(endPriceInput.value);

        if(startPrice <= 0) return;

        if(endPrice > 0) {
            setCloseOffers(prev => ([
                {
                    startPrice,
                    endPrice
                } as Offer,
                ...prev
            ]))
        } else {
            setOpenOffers(prev => ([
                {
                    startPrice,
                    endPrice: 0
                } as Offer,
                ...prev
            ]));
        }

        setLastOffer(()=> ({
            startPrice,
            endPrice: endPrice ?? 0
        } as Offer));

        startPriceInput.value = '';
        endPriceInput.value = '';
    }

    function clearSession () {
        localStorage.removeItem('session');

        setSessionInfo({
            startSum: 0,
            totalProfit: 0,
            minOffer: 0,
            maxOffer: 0,
            offersProfit: 0,
            offersLoss: 0,
            date: ''
        });
        setOpenOffers([]);
        setCloseOffers([]);
        setLastOffer(null);
    }

    function openSessions () { allSessionRef.current?.classList.toggle('_show') }

    return (
        <div className="note">
            <div className="note__header__container">
                <div className="note__header">
                    <label>
                        Начальная сумма&nbsp;
                        <input name="total-sum"
                               value={SESSION.startSum === 0 ? '-' : SESSION.startSum + " ₽"}
                               readOnly/>
                    </label>
                    <label>
                        Общий доход&nbsp;
                        <input name="total-profit"
                               className={(SESSION.totalProfit > 0 ? '_green' : '_red')}
                               value={SESSION.totalProfit === 0 ? '-' :
                                   `${SESSION.totalProfit.toFixed(2)} ₽ | ${((SESSION.totalProfit / SESSION.startSum) * 100).toFixed(2)}%`}
                               readOnly/>
                    </label>
                    <label>
                        Самая убыточная сделка&nbsp;
                        <input name="min-offer"
                               className={(SESSION.minOffer < 0 ? '_red' : '')}
                               value={SESSION.minOffer === 0 ? '-' :
                            `${SESSION.minOffer.toFixed(2)} ₽ | ${((SESSION.minOffer / SESSION.startSum) * 100).toFixed(2)}%`} readOnly/>
                    </label>
                    <label>
                        Самая прибыльная сделка&nbsp;
                        <input name="max-offer"
                               className={(SESSION.maxOffer > 0 ? '_green' : '')}
                               value={SESSION.maxOffer === 0 ? '-' :
                            `${SESSION.maxOffer.toFixed(2)} ₽ | ${((SESSION.maxOffer / SESSION.startSum) * 100).toFixed(2)}%`} readOnly/>
                    </label>
                    <label>
                        Доход со сделок&nbsp;
                        <input name="offers=profit"
                               className={(SESSION.offersProfit > 0 ? '_green' : '')}
                               value={SESSION.offersProfit === 0 ? '-' :
                            `${SESSION.offersProfit.toFixed(2)} ₽ | ${((SESSION.offersProfit / SESSION.startSum) * 100).toFixed(2)}%`} readOnly/>
                    </label>
                    <label>
                        Расход со сделок&nbsp;
                        <input name="offers-loss"
                               className={(SESSION.offersLoss < 0 ? '_red' : '')}
                               value={SESSION.offersLoss === 0 ? '-' :
                            `${SESSION.offersLoss.toFixed(2)} ₽ | ${((SESSION.offersLoss / SESSION.startSum) * 100).toFixed(2)}%`} readOnly/>
                    </label>
                </div>
            </div>
            <div className="note__body">
                <div className="note__block">
                    <div className="note__block__name">Закрытые сделки</div>
                    <div className="note__block__content">
                        {closeOffers.map((offer, index) => {
                            const PERCENT = (((offer.endPrice - offer.startPrice) / offer.startPrice) * 100);

                            return (
                                <div
                                    key={index}
                                    className={"note__block__offer" + (PERCENT < 0.0 ? ' _red' : PERCENT > 0.10 ? ' _green' : PERCENT > 0.05 ? " _midi-green" : " _light-green")}>
                                    <div className={'note__block__offer__delete'} onClick={()=> {
                                        if(!confirm('')) return;

                                        setCloseOffers(prev => {
                                            const updated = [...prev];
                                            const deleted = updated.splice(index, 1)[0];

                                            if(lastOffer?.startPrice === deleted.startPrice && lastOffer.endPrice === deleted.endPrice) {
                                                setLastOffer(updated.length > 0 ? updated[0] as Offer : null);
                                            }

                                            return updated;
                                        });
                                    }}>📛</div>
                                    <span>{offer.startPrice} =&gt; {offer.endPrice}</span>
                                    <span>{(offer.endPrice - offer.startPrice).toFixed(2)} ₽</span>
                                    <span>{PERCENT.toFixed(2)}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="note__block">
                    <div className="note__block__name">Открытые сделки</div>
                    <div className="note__block__content">
                        {openOffers.map((offer, index) => (
                            <div
                                key={index}
                                className={"note__block__offer _open"}>
                                <label>{offer.startPrice} =&gt; <input type='number' name="close-price"/> ₽</label>
                                <span>0 ₽</span>
                                <span>0%</span>
                                <button className={"note__block__content__edit"} onClick={({currentTarget})=> {
                                    const endPrice = Number((currentTarget.parentElement!.querySelector('input') as HTMLInputElement).value);

                                    if(endPrice <= 0) return;

                                    setOpenOffers(prev => {
                                        const updated = [...prev];
                                        const offer = updated.splice(index, 1)[0];

                                        setCloseOffers(close => [{ ...offer, endPrice }, ...close]);

                                        return updated;
                                    });
                                    setLastOffer(()=> ({
                                        startPrice: offer.startPrice,
                                        endPrice
                                    } as Offer));
                                }}>📌</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="note__block">
                    <div className="note__block__name">Последняя сделка</div>
                    <div className="note__block__content">
                        {lastOffer !== null && lastOffer.endPrice === 0 &&
                            <div
                                className={"note__block__offer"}>
                                <span>{lastOffer.startPrice} =&gt; - </span>
                                <span>0 ₽</span>
                                <span>0%</span>
                            </div>
                        }
                        {lastOffer !== null && lastOffer.endPrice !== 0 &&
                            <div
                                className={"note__block__offer" +
                                    (lastOffer.startPrice > lastOffer.endPrice ? ' _red' : ' _green')}>
                                <span>{lastOffer.startPrice} =&gt; {lastOffer.endPrice}</span>
                                <span>{(lastOffer.endPrice - lastOffer.startPrice).toFixed(2)} ₽</span>
                                <span>{(((lastOffer.endPrice - lastOffer.startPrice) / lastOffer.startPrice) * 100).toFixed(2)}%</span>
                            </div>
                        }
                    </div>
                </div>
                <div className="note__block _sessions" ref={allSessionRef}>
                    <div className="note__block__name">Все сессии</div>
                    <div className="note__block__content">
                        {ALL_SESSIONS.map((session, i)=> (
                            <div key={session.date} className={"note__block__offer__container"}>
                                {SESSION.date === session.date ?
                                    <div className={"note__block__mark"}>💠</div> :
                                    <div className={"note__block__mark"} style={{cursor: "pointer"}}
                                         onClick={() => {
                                             setSessionInfo(session.info);

                                             session.closeOffers !== undefined && setCloseOffers(session.closeOffers);
                                             session.openOffers !== undefined && setOpenOffers(session.openOffers);
                                             session.lastOffer !== undefined && setLastOffer(session.lastOffer);
                                         }}>🔗</div>
                                }
                                <div className={"note__block__offer _session"}
                                     style={SESSION.date === session.date ? {border: "1px solid #575757"} : {}}>
                                    <span>{session.date}</span>
                                    <span>{session.info.startSum}</span>
                                    <span>{session.closeOffers?.length}</span>
                                    <span className={(session.info.totalProfit > 0 ? '_green' : '_red')}>
                                        {session.info.totalProfit === 0 ? '-' :
                                            `${session.info.totalProfit} ₽ | ${((session.info.totalProfit / session.info.startSum) * 100).toFixed(2)}%`
                                        }
                                    </span>
                                    <span className={(session.info.offersProfit > 0 ? '_green' : '')}>
                                        {session.info.offersProfit === 0 ? '-' :
                                            `${session.info.offersProfit} ₽ | ${((session.info.offersProfit / session.info.startSum) * 100).toFixed(2)}%`
                                        }
                                    </span>
                                    <span className={(session.info.offersLoss < 0 ? '_red' : '')}>
                                        {session.info.offersLoss === 0 ? '-' :
                                            `${session.info.offersLoss} ₽ | ${((session.info.offersLoss / session.info.startSum) * 100).toFixed(2)}%`
                                        }
                                    </span>
                                </div>
                                <div className={"note__block__offer__delete _right"} onClick={() => {
                                    if (!confirm('')) return;

                                    SESSION.date === session.date && clearSession();

                                    setAllSessions(prev => {
                                        const updated = [...prev];
                                        updated.splice(i, 1)

                                        localStorage.setItem('allSessions', JSON.stringify(updated));

                                        return updated;
                                    });
                                }}>
                                    📛
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="note__footer">
                {SESSION.startSum !== 0 &&
                    <>
                        <div className="note__footer__block">
                            <label>
                                <input name="start-price" placeholder="Покупка" type={'number'}
                                       onKeyDown={(e) => e.key === "Enter" && addNewOfferHandler(e)}/>
                                {" => "}
                                <input name="end-price" placeholder="Продажа" type={'number'}
                                       onKeyDown={(e) => e.key === "Enter" && addNewOfferHandler(e)}/>
                            </label>
                            <button onClick={addNewOfferHandler}>Добавить</button>
                        </div>
                        <div className="note__footer__block">
                            <button className={"note__footer__sessions"} onClick={openSessions}>🔺</button>
                            <button className={"note__footer__restart"} onClick={()=> {
                                if(!confirm('')) return;

                                clearSession();
                            }}>Новая сессия</button>
                        </div>
                    </>
                }
                {SESSION.startSum === 0 &&
                    <>
                        <div className="note__footer__block">
                            <label>
                                Введите начальную сумму:
                                <input name="start-sum" type={'number'}/>
                            </label>
                            <button onClick={setStartSumHandler}>Подтвердить</button>
                        </div>
                        <div className="note__footer__block">
                            <button className={"note__footer__sessions"} onClick={openSessions}>🔺</button>
                        </div>
                    </>
                }
            </div>
        </div>
    )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <App/>
);

