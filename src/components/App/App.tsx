import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import Form, { IChangeEvent } from 'react-jsonschema-form';
import Spinner from '../Spinner';
import { AppState, AppConfig } from './appTypes';
import PhoneInput from 'react-phone-number-input';
import DescriptionField from '../DescriptionField';
import ObjectFieldTemplate from '../ObjectFieldTemplate';
import NaturalNumberInput from '../NaturalNumberInput';
import PriceTicker from '../PriceTicker';

import { calculatePrice } from '../utils';

import 'react-phone-number-input/style.css'
import './App.css';

// TODO(evinism): Make this better typed
const widgetMap: any = {
    PhoneInput: (props: any) => (
        <PhoneInput
            country="US"
            value={props.value}
            onChange={(value: string) => props.onChange(value)}
        />
    ),
    NaturalNumberInput: (props: any) => (
        <NaturalNumberInput
            value={props.value}
            onChange={(value: string) => props.onChange(value)}
        />
    ),
}


class App extends React.Component {
    state: AppState = {
        status: 'fetching',
    }

    constructor(props = {}) {
        super(props);

        this.getConfig();
    }

    componentDidUpdate() {
        if (this.state.status === 'loaded') {
            const config = this.state.config;

            if (config && config.pricing) {
                // Because of the way that react-jsonschema-form works, this is the
                // simplest way to "templatify" the pricing
                Object.keys(config.pricing).forEach(
                    (key) => {
                        const price = config.pricing[key];

                        const els = document.getElementsByClassName("pricing_" + key);

                        for (let i = 0; i < els.length; i++) {
                            els[i].innerHTML = '$' + Math.abs(price);
                        }
                    }
                );
            }
        }
    }

    onSubmit = async ({formData}: any) => {
        this.setState({status: 'submitting'});
        try {
            const res = await fetch('/register.php', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            const text = await res.text();
            console.log('response', res.status, text)
            this.setState({ status: 'submitted' });
        } catch {
            this.setState({ status: 'submissionError' });
        }
    }

    getConfig = async () => {
        let config: AppConfig;

        try {
            const res = await fetch('/config.json');
            config = await res.json();
        } catch (e) {
            console.error(e);
            return;
        }

        this.setState({
            status: 'loaded',
            config,
            formData: undefined,
            totals: {},
        });

    }

    onChange = ({formData}: IChangeEvent) => {
        console.log(formData);
        this.setState({ formData });
    }

    transformErrors = (errors: Array<any>) => errors.map(error => {
        if (error.name === 'pattern' && error.property === '.payer_number') {
            return {
                ...error,
                message: 'Please enter a valid phone number',
            };
        }

        return error;
    });

    render() {
        let pageContent : JSX.Element;
        switch(this.state.status){
            case 'loaded':
            case 'submitting':
                pageContent = (
                    <section>
                    <Form
                    schema={this.state.config.dataSchema}
                    uiSchema={this.state.config.uiSchema}
                    widgets={widgetMap}
                    fields={{DescriptionField: DescriptionField}}
                    ObjectFieldTemplate={ObjectFieldTemplate}
                    onChange={this.onChange}
                    onSubmit={this.onSubmit}
                    onError={() => console.log('errors')}
                    formData={this.state.formData}
                    transformErrors={this.transformErrors}
                    // liveValidate={true}
                    >
                    <div>
                    <p>By submitting this form, you agree to the <a href="http://www.larkcamp.org/campterms.html" target="_blank">Terms of Registration</a>.</p>
                    <button type="submit" className="btn btn-info">Submit Registration</button>
                    </div>
                    </Form>
                    <PriceTicker price={calculatePrice(this.state).total || 0} />
                    </section>
                );  
                break;
            case 'submitted':
                pageContent = (
                    <section className="reciept">
                    <h1>You're all set!</h1>
                    <h2>See you at Lark Camp 2020!</h2>
                    <p> We'll be sending you a confirmation with payment instructions within the next week. </p>

                    <p>Do you need approval for your vehicle or trailer, have
                    questions about carpooling, payments, meals, ordering
                    t-shirts, or anything else?  Email us at
                    <a href="mailto: registration@larkcamp.org"> registration@larkcamp.org </a>
                    or call 707-397-5275.</p>

                    <a href="https://www.larkcamp.org">Visit our website at www.larkcamp.org for more information!</a>
                    </section>
                )
                break;
            default: 
                pageContent = (<Spinner />);
        }
        return (
            <div className="App">
            {pageContent}
            </div>
        );
    }
}

export default App;
