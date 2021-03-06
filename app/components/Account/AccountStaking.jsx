import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import AmountSelector from "../Utility/AmountSelector";
import BalanceComponent from "../Utility/BalanceComponent";
import {ChainStore} from "bitsharesjs/es";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import {Apis} from "bitsharesjs-ws";
import { debounce } from "lodash";
import { checkFeeStatusAsync } from "common/trxHelper";
import counterpart from "counterpart";

const BCO_ID = '1.3.1564';

class VestingBalance extends React.Component {

    _onClaim(claimAll, e) {
        e.preventDefault();
        WalletActions.claimStakingBalance(this.props.account.id, this.props.vb, true);
    }

    render() {
        let {account, vb} = this.props;
        if (!this.props.vb) {
            return null;
        }
        // let vb = ChainStore.getObject( this.props.vb );
        // if (!vb) {
        //     return null;
        // }
        let available=false;
        let difference=0;
        let cvbAsset, vestingPeriod, remaining, earned, secondsPerDay = 60 * 60 * 24,
            availablePercent, balance;
        if (vb) {
            balance = vb.balance.amount;
            cvbAsset = ChainStore.getAsset(vb.balance.asset_id);
            earned = vb.policy[1].coin_seconds_earned;
            vestingPeriod = vb.policy[1].vesting_seconds;

            let d = new Date(vb.policy[1].start_claim);
            let d1 = new Date(vb.policy[1].start_claim);



            d1.setSeconds(d1.getSeconds() + vb.policy[1].vesting_seconds);
            available = false;
            if (new Date() >= d1 ) {
                available = true;
                difference = 0;
            } else {
                difference = parseInt((d1.getTime()/1000) - new Date().getTime()/1000);
                difference = (difference / 86400).toFixed(2);
            }





            availablePercent = earned / (vestingPeriod * balance);
        }

        let account_name = account.name;

        if (!cvbAsset) {
            return null;
        }

        if (!balance) {
            return null;
        }

        return (
            <div style={{paddingBottom: "1rem"}}>
                <div className="">
                    <div className="grid-content no-padding">
                        <h5><Translate content="account.cryptobridge.id" /> {vb.id}</h5>
                        <table className="table key-value-table">
                            <tbody>
                                <tr>
                                    <td><Translate content="account.cryptobridge.staking_amount"/> </td>
                                    <td><FormattedAsset amount={vb.balance.amount} asset={vb.balance.asset_id} /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.cryptobridge.remaining" /></td>
                                    <td>{ difference > 0 ? <Translate days={ difference } content="account.cryptobridge.days"/> : <Translate className='green' content="account.cryptobridge.available"/> }</td>
                                </tr>
                                <tr>
                                    <td><Translate content="account.cryptobridge.status" /></td>
                                    <td colSpan="2" style={{textAlign: "right"}}>
                                        { available ?  <button onClick={this._onClaim.bind(this, false)} className="button outline"><Translate content="account.member.claim" /></button> : <Translate content="account.cryptobridge.staking" />}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        );
    }
}

class AccountStakeCreateNew extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            amount: 0,
            selectedPeriod: 2678400,
            checked: false,
            showValidationErrors: false,
            periods: [
                {
                    name1: 'account.cryptobridge.month_1',
                    bonus: '0%',
                    name: counterpart.translate("account.cryptobridge.month_1", {bonus: '0%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_1_plural"),
                    value: 2678400
                },
                {
                    name1: 'account.cryptobridge.month_3',
                    bonus: '20%',
                    name: counterpart.translate("account.cryptobridge.month_3", {bonus: '20%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_3_plural"),
                    value: 7776000
                },
                {
                    name1: 'account.cryptobridge.month_6',
                    bonus: '50%',
                    name: counterpart.translate("account.cryptobridge.month_6", {bonus: '50%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_6_plural"),
                    value: 15552000
                },
                {
                    name1: 'account.cryptobridge.month_12',
                    bonus: '100%',
                    name: counterpart.translate("account.cryptobridge.month_12", {bonus: '100%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_12_plural"),
                    value: 31536000
                }
            ]

        }
        this.onAmountChanged = this.onAmountChanged.bind(this)
        this._setTotal = this._setTotal.bind(this);
        this.setPeriod = this.setPeriod.bind(this);
        this.stakeBalance = this.stakeBalance.bind(this);
        this.getMonths = this.getMonths.bind(this);
        this.checkTerms = this.checkTerms.bind(this);
    }

    onAmountChanged(amount) {
        this.setState({amount: amount.amount});
    }

    checkTerms() {

        this.setState({checked: !this.state.checked, showValidationErrors: false});
    }


    _setTotal(asset_id, balance_id) {
    }

    setPeriod(period) {
        this.setState({selectedPeriod: parseInt(period.target.value, 10)})
    }

    stakeBalance() {
        if (!this.state.checked) {
            this.setState({showValidationErrors: true});
        } else {
            WalletActions.stakeBalance(this.props.accountId, this.state.selectedPeriod, this.state.amount);
        }
    }

    getMonths() {
        if (this.state.periods) {
            for (let i=0;i<this.state.periods.length;i++) {
                let p = this.state.periods[i];
                if (p.value && p.value === this.state.selectedPeriod) {
                    return p.monthName;
                }
            }
        }
        return false;
    }

    render() {
        let balance = null;
        let key=0;
        let account_balances = this.props.balances.toJS();
        let month = this.getMonths();
        let style;

        if (this.state.showValidationErrors) {
            style = {color: 'red'};
        }

        balance = (<span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._setTotal(BCO_ID, account_balances[BCO_ID], 0, 0)}> { account_balances[BCO_ID] ? <Translate component="span" content="account.cryptobridge.bco_available"/> : <Translate component="span" content="account.cryptobridge.bco_not_available"/> } <BalanceComponent balance={account_balances[BCO_ID]}/></span>);
        return (
                <div style={{'marginTop': '20px'}} className="small-12 grid-content1">

                        <h5><b><Translate content="account.cryptobridge.title" /></b></h5>

                        <p>
                            <Translate  content="account.cryptobridge.staking_text1" percent="50%" unsafe/>
                        </p>
                        <p>
                            <Translate content="account.cryptobridge.staking_text2" fee={this.props.feeAmount || 0} unsafe  />
                        </p>

                        <Translate component="p" content="account.cryptobridge.staking_text3" unsafe />


                        <label style={{'paddingTop': '20px'}}><Translate component="p" unsafe content="account.cryptobridge.amount_bco"/></label>
                        <AmountSelector
                                    label="transfer.amount"
                                    amount={this.state.amount}
                                    onChange={this.onAmountChanged.bind(this)}
                                    asset={BCO_ID}
                                    assets={[BCO_ID]}
                                    display_balance={balance}
                                    tabIndex={0}
                        />

                    <label  style={{'paddingTop': '20px'}}><Translate content="account.cryptobridge.length" /></label>
                    <select onChange={this.setPeriod} value={this.state.selectedPeriod}>
                        {
                        this.state.periods.map((p) => {
                            if (!p || p === "") {return null; }
                            return <option key={key++} value={p.value}><Translate content={p.name1} unsafe bonus={p.bonus} /></option>;
                        })}
                    </select>
                    { this.state.amount > 0 ?( <label className={this.state.showValidationErrors ? 'has-errors' : ''}>
                        <input  type="checkbox" onChange={this.checkTerms} checked={this.state.checked}/>
                        <Translate style={style} unsafe content="account.cryptobridge.understand" amount={ this.state.amount } month={ month } />
                    </label> ) : null }

                    <p  style={{textAlign: "right"}}>
                        <button onClick={this.stakeBalance} className="button outline"><Translate content="account.cryptobridge.stake_bco" /></button>
                    </p>


                </div>
        );
    }
}

class AccountVesting extends React.Component {
    constructor() {
        super();

        this.state = {
            vbs: null
        };
        this.updateFee = debounce(this.updateFee.bind(this), 250);
    }

    componentDidMount() {
        this.updateFee();
    }

    updateFee(fee_asset_id = BCO_ID) {
        checkFeeStatusAsync(
            {
                accountID: this.props.account.get("id"),
                feeID: fee_asset_id,
                type: 'vesting_balance_create'
            }
        )
        .then(({fee, hasBalance, hasPoolBalance}) => {
            this.setState({
                feeAmount: fee.getAmount({real: true}),
                hasBalance,
                hasPoolBalance,
                error: (!hasBalance || !hasPoolBalance)
            });
        });
    }

    componentWillMount() {
        this.retrieveVestingBalances.call(this, this.props.account.get("id"));
    }

    componentWillUpdate(nextProps){
        let newId = nextProps.account.get("id");
        let oldId = this.props.account.get("id");

        if(newId !== oldId){
            this.retrieveVestingBalances.call(this, newId);
        }
    }

    retrieveVestingBalances(accountId){
        Apis.instance().db_api().exec("get_vesting_balances", [
            accountId
        ]).then(vbs => {
            this.setState({vbs});
        }).catch(err => {
            console.log("error:", err);
        });
    }

    render() {
        let {vbs} = this.state;
        if (!vbs || !this.props.account || !this.props.account.get("vesting_balances")) {
            return null;
        }

        let account = this.props.account.toJS();
        let balances = vbs.map(vb => {
            //console.log('Balance amount ' + vb.balance.amount);
            if (vb.balance.amount && vb.policy && vb.policy[1].coin_seconds_earned && vb.balance.asset_id === '1.3.1564') {
                return <VestingBalance key={vb.id} vb={vb} account={account}/>;
            }
        }).filter(a => {
            return !!a;
        });

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>

                <div className="grid-content">
                    <AccountStakeCreateNew feeAmount={this.state.feeAmount} accountId={this.props.account.get("id")} balances={this.props.account.get('balances')}/>

                    {!balances.length ? (
                    <h4 style={{paddingTop: "1rem"}}>
                        <Translate content={"account.cryptobridge.no_balances"}/>
                    </h4>) : balances}
                </div>
            </div>
);
    }
}

AccountVesting.VestingBalance = VestingBalance;
export default AccountVesting;
